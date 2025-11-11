const fs = require('fs');
const p = 'src/components/lead/bulk-register/BulkImportModal.tsx';
let s = fs.readFileSync(p, 'utf8');

const headerRe = /(\<th className=\"px-2 py-2 font-semibold\"\>[\s\S]*?\{map\.leadSource[\s\S]*?\}<\/th>)/;
if (headerRe.test(s)) {
  s = s.replace(headerRe, `$1\n              {map.remark !== \"none\" && <th className=\"px-2 py-2 font-semibold\">{map.remark} (remark)</th>`);
}

const declRe = /(const invalid = [^\n]+\n)/;
if (declRe.test(s)) {
  s = s.replace(declRe, `$1              const remarkVal = map.remark !== \"none\" ? toStr(r[(map.remark as string)]) : \"\";\n`);
}

const rowRe = /(\<td className=\"px-2 py-1\.5\">\{source\}<\/td>)/;
if (rowRe.test(s)) {
  s = s.replace(rowRe, `$1\n                  {map.remark !== \"none\" && (\n                    <td className=\"px-2 py-1.5\" title={remarkVal}>\n                      {remarkVal || \"—\"}\n                    </td>\n                  )}`);
}

fs.writeFileSync(p, s);
console.log('BulkImportModal patched');
