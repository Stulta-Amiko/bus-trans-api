import * as fs from 'fs';
import path from 'path';

const main = async () => {
  let directoryPath = './data/exp_each';
  let result = new Map();
  let sameDetect = [];

  let readPath = fs.readdirSync(directoryPath);
  readPath.shift();

  readPath.map((item) => {
    sameDetect.push(item);
    let arrSave = `./data/exp_each/${item}`;
    let arrPath = fs.readdirSync(arrSave);
    let arrArray = [];
    arrPath.map((arrItem) => {
      if (!(arrItem === '.DS_Store')) {
        const word = arrItem.split('_');
        arrArray.push(word[0]);
      }
    });
    result.set(item, arrArray);
  });

  directoryPath = './data/int_each';

  readPath = fs.readdirSync(directoryPath);
  readPath.shift();

  readPath.map((item) => {
    if (!sameDetect.includes(item)) {
      sameDetect.push(item);
      let arrSave = `./data/int_each/${item}`;
      let arrPath = fs.readdirSync(arrSave);
      let arrArray = [];
      arrPath.map((arrItem) => {
        if (!(arrItem === '.DS_Store')) {
          const word = arrItem.split('_');
          arrArray.push(word[0]);
        }
      });
      result.set(item, arrArray);
    } else {
      let arrSave = `./data/int_each/${item}`;
      let arrPath = fs.readdirSync(arrSave);
      arrPath.map((arrItem) => {
        if (!(arrItem === '.DS_Store')) {
          const word = arrItem.split('_');
          if (!result.get(item).includes(word[0])) {
            result.get(item).push(word[0]);
          }
        }
      });
    }
  });

  console.log(sameDetect);
  // 배열을 JSON 문자열로 변환
  const jsonArr = JSON.stringify(sameDetect);

  let search = '서';
  let searchItem = [];

  sameDetect.map((item) => {
    let regex = new RegExp(`${search}`);
    if (regex.test(item)) {
      console.log('true?', item);
      searchItem.push(item);
    }
  });

  searchItem = searchItem.sort();

  console.log(searchItem);

  // JSON 문자열을 파일로 저장
  //fs.writeFileSync('arrayData.json', jsonArr);
  // Map을 객체로 변환
  const obj = Object.fromEntries(result);

  // 객체를 JSON 문자열로 변환
  const jsonString = JSON.stringify(obj);
  fs.writeFileSync('mapData.json', jsonString);
};

main();
