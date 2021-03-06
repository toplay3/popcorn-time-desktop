/**
 * Screenshot tests
 *
 * This file needs to be separate from e2e because the app needs to be recompiled
 * separeately with the flag API_USE_MOCK_DATA
 */
import path from 'path';
import fs from 'fs';
import { Application } from 'spectron';
import { expect } from 'chai';
import imageDiff from 'image-diff';
import gm from 'gm';
import electronPrebuilt from 'electron-prebuilt';


const app = new Application({
  path: electronPrebuilt,
  args: [
    path.join(__dirname, '..', 'app')
  ],
  waitTimeout: 2000
});

const delay = time => new Promise(resolve => setTimeout(resolve, time));

describe('screenshot', function testApp() {
  this.retries(3);
  this.slow(5000);

  // Constructs url similar to file:///Users/john/popcorn-desktop-experimental/app/app.html#/${url}
  const navigate = url => this.app.client.url(`file://${process.cwd()}/app/app.html#/${url}`);

  before(async done => {
    try {
      this.app = await app.start();
      done();
    } catch (error) {
      done(error);
    }
  });

  after(done => {
    try {
      if (this.app && this.app.isRunning()) {
        return this.app.stop();
      }
      done();
    } catch (error) {
      done(error);
    }
  });

  describe('HomePage', () => {
    beforeEach(async done => {
      try {
        await navigate('');
        await delay(2000);
        done();
      } catch (error) {
        done(error);
      }
    });

    it('should display CardList', async done => {
      try {
        await screenshotTest(this.app, 'CardList');
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe('MoviePage', () => {
    beforeEach(async done => {
      try {
        await navigate('item/shows/tt0944947');
        await delay(2000);
        done();
      } catch (error) {
        done(error);
      }
    });

    it('should display Movie', async done => {
      try {
        await screenshotTest(this.app, 'MoviePage', 0.3);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

async function screenshotTest(_app, filename, differencePercentage = 0.2) {
  const diff = await handleScreenshot(_app, filename);
  // Allow 10% of pixels to be different by default
  expect(diff).to.have.deep.property('percentage').that.is.below(differencePercentage);
}

async function handleScreenshot(_app, filename) {
  // Check if the file exists
  const hasExpectationScreenshot = await new Promise(resolve => {
    fs.access(`./test/screenshots/${filename}.png`, error => {
      if (error) {
        return resolve(false);
      }
      return resolve(true);
    });
  });

  if (hasExpectationScreenshot) {
    return compareScreenshot(_app, filename);
  }

  console.log('Does not have screenshot');
  await capturePage(_app, filename, './test/screenshots');
  return compareScreenshot(_app, filename);
}

async function capturePage(_app, filename, basePath) {
  const imageMagickSubClass = gm.subClass({ imageMagick: true });

  const imageBuffer = await app.browserWindow.capturePage();
  await imageMagickSubClass(imageBuffer)
    .resize(800)
    .write(`${basePath}/${filename}.png`, error => {
      if (error) console.log(error);
    });
}

async function compareScreenshot(_app, filename) {
  await capturePage(_app, filename, './.tmp');

  return new Promise((resolve, reject) =>
    imageDiff.getFullResult({
      actualImage: `./.tmp/${filename}.png`,
      expectedImage: `./test/screenshots/${filename}.png`,
      diffImage: './.tmp/difference.png'
    }, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    })
  );
}
