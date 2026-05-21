/**
 * storage.js — localStorage 读写封装
 * 键名：sb_courses（课程数组）、sb_examples（例题数组）
 */

const STORAGE_KEYS = {
  courses: 'sb_courses',
  examples: 'sb_examples',
};

// ===== 初始化 =====
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.courses)) {
    localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.examples)) {
    localStorage.setItem(STORAGE_KEYS.examples, JSON.stringify([]));
  }
}

// 迁移旧数据：为缺少 parentId / showInMindmap 的概念补上默认值
function migrateConceptsData(courses) {
  let migrated = false;
  (courses || []).forEach(course => {
    (course.chapters || []).forEach(ch => {
      (ch.concepts || []).forEach(concept => {
        if (concept.parentId === undefined) {
          concept.parentId = null;
          migrated = true;
        }
        if (concept.showInMindmap === undefined) {
          concept.showInMindmap = true;
          migrated = true;
        }
      });
    });
  });
  return migrated;
}

// ===== 课程操作 =====
function getCourses() {
  try {
    const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.courses)) || [];
    if (migrateConceptsData(courses)) {
      // 静默写回迁移后的数据
      localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(courses));
    }
    return courses;
  } catch (e) {
    return [];
  }
}

function saveCourses(courses) {
  try {
    localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(courses));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      showToast('存储空间不足！请清理例题中的大图片/PDF 或导出数据后清空', 'error');
    } else {
      showToast('数据保存失败', 'error');
    }
  }
}

function getCourseById(courseId) {
  const courses = getCourses();
  return courses.find(c => c.id === courseId) || null;
}

function addCourse(course) {
  const courses = getCourses();
  courses.push(course);
  saveCourses(courses);
}

function updateCourse(courseId, updates) {
  const courses = getCourses();
  const idx = courses.findIndex(c => c.id === courseId);
  if (idx !== -1) {
    courses[idx] = { ...courses[idx], ...updates };
    saveCourses(courses);
    return true;
  }
  return false;
}

function deleteCourse(courseId) {
  let courses = getCourses();
  courses = courses.filter(c => c.id !== courseId);
  saveCourses(courses);
  let examples = getExamples();
  examples = examples.filter(e => e.courseId !== courseId);
  saveExamples(examples);
}

// ===== 嵌套数据辅助函数 =====

// 按 courseId + chapterId 定位章节，返回 { course, chapter } 或 null
function getChapter(courseId, chapterId) {
  const course = getCourseById(courseId);
  if (!course) return null;
  const chapter = (course.chapters || []).find(ch => ch.id === chapterId);
  if (!chapter) return null;
  return { course, chapter };
}

// 按 courseId + chapterId + conceptId 定位概念，返回 { course, chapter, concept } 或 null
function getConcept(courseId, chapterId, conceptId) {
  const result = getChapter(courseId, chapterId);
  if (!result) return null;
  const concept = (result.chapter.concepts || []).find(c => c.id === conceptId);
  if (!concept) return null;
  return { course: result.course, chapter: result.chapter, concept };
}

// 创建或更新概念（按 concept.id 判断），自动写回 storage
function saveConcept(courseId, chapterId, concept) {
  const result = getChapter(courseId, chapterId);
  if (!result) return false;
  const { course, chapter } = result;
  if (!chapter.concepts) chapter.concepts = [];
  const idx = chapter.concepts.findIndex(c => c.id === concept.id);
  if (idx !== -1) {
    chapter.concepts[idx] = concept;
  } else {
    chapter.concepts.push(concept);
  }
  return updateCourse(course.id, { chapters: course.chapters });
}

// 删除概念（支持级联删除子孙概念），自动写回 storage
function deleteConcept(courseId, chapterId, conceptId, cascade = false) {
  const result = getChapter(courseId, chapterId);
  if (!result) return false;
  const { course, chapter } = result;
  if (!chapter.concepts) return false;

  const idsToRemove = new Set([conceptId]);
  if (cascade) {
    // 递归收集所有子孙概念 id
    const collectChildren = (pid) => {
      (chapter.concepts || []).filter(c => c.parentId === pid).forEach(c => {
        idsToRemove.add(c.id);
        collectChildren(c.id);
      });
    };
    collectChildren(conceptId);
  }

  chapter.concepts = chapter.concepts.filter(c => !idsToRemove.has(c.id));
  return updateCourse(course.id, { chapters: course.chapters });
}

// ===== 例题操作 =====
function getExamples() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.examples)) || [];
  } catch (e) {
    return [];
  }
}

function saveExamples(examples) {
  try {
    localStorage.setItem(STORAGE_KEYS.examples, JSON.stringify(examples));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      showToast('存储空间不足！请清理例题中的大图片/PDF 或导出数据后清空', 'error');
    } else {
      showToast('数据保存失败', 'error');
    }
  }
}

function getExamplesByCourse(courseId) {
  return getExamples().filter(e => e.courseId === courseId);
}

function addExample(example) {
  const examples = getExamples();
  examples.push(example);
  saveExamples(examples);
}

function updateExample(exampleId, updates) {
  const examples = getExamples();
  const idx = examples.findIndex(e => e.id === exampleId);
  if (idx !== -1) {
    examples[idx] = { ...examples[idx], ...updates };
    saveExamples(examples);
    return true;
  }
  return false;
}

function deleteExample(exampleId) {
  let examples = getExamples();
  examples = examples.filter(e => e.id !== exampleId);
  saveExamples(examples);
}

// ===== 导出/导入 =====
function exportData() {
  const data = {
    courses: getCourses(),
    examples: getExamples(),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `studyboard-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('数据已导出', 'success');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.courses || !data.examples) {
        throw new Error('无效的备份文件格式');
      }
      const existingCourses = getCourses();
      const existingExamples = getExamples();
      const newCourses = data.courses.filter(c => !existingCourses.find(ec => ec.id === c.id));
      const newExamples = data.examples.filter(e => !existingExamples.find(ee => ee.id === e.id));
      saveCourses([...existingCourses, ...newCourses]);
      saveExamples([...existingExamples, ...newExamples]);
      showToast(`导入成功：${newCourses.length} 门课程，${newExamples.length} 条例题`, 'success');
      refreshSidebarCourses();
      if (AppState.currentTab === 'courses') switchTab('courses');
    } catch (err) {
      showToast('导入失败：文件格式不正确', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  localStorage.removeItem(STORAGE_KEYS.courses);
  localStorage.removeItem(STORAGE_KEYS.examples);
  initStorage();
  showToast('所有数据已清空', 'success');
}
