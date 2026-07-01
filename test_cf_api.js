const https = require('https');

https.get('https://codeforces.com/api/user.info?handles=26Krishna_Mehta;_niyatiag17_', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});
