/* lesson_full.js : the whole lesson = lesson_parts/A.js + B.js + C.js (each part also runs standalone: ?lesson=lesson_parts/A) */
window.__FULL = true; window.LESSON_PARTS = {};
['A'].forEach(p => document.write('<script src="lesson_parts/' + p + '.js"><\/script>'));
document.write('<script>window.LESSON = { title: "Ardışık İntegraller", pad: { pre: .5, post: .9 }, overflow: "scroll",' +
  ' scenes: [].concat(...["A"].map(p => (LESSON_PARTS[p] || { scenes: [] }).scenes)) };<\/script>');
