const upload = require("./middleware/upload");
const fs = require("fs");
const path = require("path");
const parser = require("xml2json");
const openTranslate = require("@vitalets/google-translate-api");
var zip = require("express-zip");

function readFile(srcPath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(srcPath, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function writeFile(savPath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(savPath, data, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function replaceToken(text, regexPatt, subBracket) {
  let replacedText = text;
  // const regexPatt = /\{[\w\d]+\}/g;
  let replacedIndex = 0;
  const replacedList = [];
  let arrPatt;
  while ((arrPatt = regexPatt.exec(text)) !== null) {
    replacedText = replacedText.replace(
      `${arrPatt[0]}`,
      `{${subBracket}${replacedIndex}${subBracket}}`
    );
    const replacedObj = {};
    replacedObj[`{${subBracket}${replacedIndex}${subBracket}}`] = arrPatt[0];
    replacedList.push(replacedObj);
    ++replacedIndex;
  }
  return {
    replacedText: replacedText,
    replacedList: replacedList,
  };
}

function replaceBackToken(replacedList, translatedText) {
  replacedList.forEach((replacedItem) => {
    for (let prop in replacedItem) {
      translatedText = translatedText.replace(
        RegExp(prop, "i"),
        replacedItem[prop]
      );
    }
  });
  return translatedText;
}

async function translate(item) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const regex = /(^\{=[\w\d]+\})?(.+)/g;
      const arr = regex.exec(item.text);
      const text = arr[2] || arr[1] || item.text;
      let replacedText = text;
      const regexPatt = /\{[\w\d]+\}/g;
      const replacedTokenCurlyBrackets = replaceToken(
        replacedText,
        /\{[\w\d]+\}/g,
        "X"
      );
      replacedText = replacedTokenCurlyBrackets.replacedText;
      const replacedTokenBrackets = replaceToken(
        replacedText,
        /\[[\d\w]\]/g,
        "W"
      );
      replacedText = replacedTokenBrackets.replacedText;
      const translated = await openTranslate(replacedText, {
        from: "en",
        to: "vi",
        raw: true,
      });
      let translatedText = translated.text;
      translatedText = replaceBackToken(
        replacedTokenCurlyBrackets.replacedList,
        translatedText
      );
      translatedText = replaceBackToken(
        replacedTokenBrackets.replacedList,
        translatedText
      );
      const translatedTextResult = `${arr[1]}${translatedText}`;
      item.text = translatedTextResult;
      resolve(item);
    }, 550);
  });
}

async function doTranslate(data) {
  const result = [];
  const promises = [];
  for (let inx = 0; inx < data.length; inx++) {
    const item = data[inx];
    promises.push(
      translate(item).then((translatedItem) => result.push(translatedItem))
    );
  }
  return Promise.all(promises).then(() => result);
}

const multipleUpload = async (req, res) => {
  try {
    await upload(req, res);
    const zip = [];
    const unlinkFiles = [];
    for (let inx = 0; inx < req.files.length; inx++) {
      const file = req.files[inx];
      const data = await readFile(file.path);
      const json = parser.toJson(data, { object: true, sanitize: false });
      const resultStrings = await doTranslate(json.base.strings.string);
      json.base.strings.string = resultStrings;
      const xml = parser.toXml(json, { sanitize: true });
      await writeFile(file.path, xml);
      zip.push({ path: file.path, name: file.filename });
      unlinkFiles.push(path.join(`${__dirname}/dist/${file.filename}`));
    }
    // zip all files to download.
    res.zip(zip);
    unlinkFiles.forEach((filePath) =>
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(err);
        }
      })
    );
    if (req.files.length <= 0) {
      return res.send(`You must select at least 1 file.`);
    }
    // return res.send(`Files has been uploaded.`);
  } catch (error) {
    console.log(error);
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.send("Too many files to upload.");
    }
    return res.send(`Error when trying upload many files: ${error}`);
  }
};

module.exports = {
  multipleUpload: multipleUpload,
};
