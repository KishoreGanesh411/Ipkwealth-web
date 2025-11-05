const fs = require('fs');
const p = 'src/core/graphql/lead/lead.gql.ts';
let s = fs.readFileSync(p, 'utf8');
// Add fields if missing in fragment
s = s.replace(/fragment LeadFields on IpkLeaddEntity \{([\s\S]*?)\n  \}/, (m, inner) => {
  let lines = inner;
  if (!/\bremark\b/.test(inner)) {
    lines += '\n    remark';
  }
  if (!/\bapproachAt\b/.test(inner)) {
    // place alongside createdAt
    lines = lines.replace(/createdAt\n/, 'createdAt\n    approachAt\n');
    if (!/\bapproachAt\b/.test(lines)) {
      lines += '\n    approachAt';
    }
  }
  return `fragment LeadFields on IpkLeaddEntity {${lines}\n  }`;
});
fs.writeFileSync(p, s);
console.log('lead.gql.ts fragment updated');
