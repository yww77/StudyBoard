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

// ===== 课程操作 =====
function getCourses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.courses)) || [];
  } catch (e) {
    return [];
  }
}

function saveCourses(courses) {
  localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(courses));
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

// ===== 例题操作 =====
function getExamples() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.examples)) || [];
  } catch (e) {
    return [];
  }
}

function saveExamples(examples) {
  localStorage.setItem(STORAGE_KEYS.examples, JSON.stringify(examples));
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
