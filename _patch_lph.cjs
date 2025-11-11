const fs = require('fs');
const p = 'src/components/sales/view_lead/LeadProfileHeader.tsx';
let s = fs.readFileSync(p, 'utf8');
const start = 'const latestRemarkText = useMemo(() => {';
const end = '}, [lead.remarks, lead.remark]);';
const i0 = s.indexOf(start);
const i1 = s.indexOf(end, i0);
if (i0 >= 0 && i1 > i0) {
  const newBlock = `const latestRemarkText = useMemo(() => {\n    const list = Array.isArray(lead.remarks) ? lead.remarks : [];\n    const ts = (s?: string | null) => {\n      const t = s ? Date.parse(s) : NaN;\n      return Number.isFinite(t) ? t : 0;\n    };\n    if (list && list.length > 0) {\n      const sorted = list.slice().sort((a, b) => ts(b.createdAt) - ts(a.createdAt));\n      return (sorted[0]?.text ?? '').toString();\n    }\n    const raw: any = (lead as any).remark;\n    if (raw && typeof raw === 'object') {\n      if (typeof raw.text === 'string') return raw.text;\n      try { return JSON.stringify(raw, null, 2); } catch { return String(raw); }\n    }\n    return (raw ?? '').toString();\n  }, [lead.remarks, lead.remark]);`;
  const before = s.slice(0, i0);
  const after = s.slice(i1 + end.length);
  s = before + newBlock + after;
  fs.writeFileSync(p, s);
  console.log('LeadProfileHeader latestRemarkText patched');
} else {
  console.log('Pattern not found in LeadProfileHeader.tsx');
}
