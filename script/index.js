const mammoth = require("mammoth");
const fs = require('fs');
const path = require('path');
const turndown = require('turndown');
const constants = require('./config.js');
const util = require('util');
const { projectConfig, imageFolderPath, positionToInsert, template, imageType } = constants;
//html->md 工具
const turndownService = new turndown();

/**
 * 为单个项目的doc转换为md
 * outputPath 输出的文件夹
 */
async function convertDocToMd(docPath, outputPath) {
  try {
    //如果当前还没有输出的文件夹，先创建一个文件夹
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }
    if (!fs.existsSync(outputPath + '/' + imageFolderPath)) {
      fs.mkdirSync(outputPath + '/' + imageFolderPath);
    }
    const result = await mammoth.convertToHtml({ path: docPath }, {
      convertImage: mammoth.images.imgElement(async (image) => {
        const imageBuffer = await image.read('base64');
        const imageExtension = image.contentType.split('/')[1];
        //如果有符合类型的图片类型
        if (Boolean(imageType.find(type => type === imageExtension))) {
          const imageName = `image_&${Date.now()}.${imageExtension}`;
          const imagePath = path.join(outputPath + '/' + imageFolderPath, imageName);
          fs.writeFileSync(imagePath, imageBuffer, 'base64');
          return {
            src: './' + imageFolderPath + '/' + imageName
          }
        }
      })
    })

    let htmlContent = result.value;
    const html = template.slice(0, positionToInsert) + htmlContent + template.slice(positionToInsert);
    const markdownContent = turndownService.turndown(html);
    await fs.writeFileSync(outputPath + '/index.md', markdownContent, 'utf-8', turndownService.turndown(html), 'utf-8', (err) => {
      if (err) {
        console.error('写入发生错误', err);
      } else {
        console.log('Markdown 文件已创建');
      }
    })
  } catch (e) {
    console.log(e, '123');
  }
}

/**
 * 项目配置
 */
async function mergeConfig() {
  //所有文件名
  let fileNames = [];
  //配置
  let config = [];
  const readDir = util.promisify(fs.readdir);
  try {
    //查找doc目录下的所有word文档
    const files = await readDir('../docFile');
    files.forEach(file => {
      if (file.endsWith('.docx') || file.endsWith('.doc')) {
        fileNames.push("../docFile/" + file);
      }
    });
    //将word文档跟配置对比，合并&生成相应的配置文件
    fileNames.forEach((item, index) => {
      const targetConfig = projectConfig.find(unit => unit.docPath === item);
      if (targetConfig) {
        config.push(targetConfig);
      } else {
        // 使用正则表达式匹配文件名部分
        const fileNameMatch = item.match(/\/([^/]+)\.\w+$/);
        config.push({
          name: fileNameMatch[1],
          docPath: item,
          outputPath: '../docs/doc_' + index,
          navTitle: fileNameMatch[1],
          navLink: '/doc_' + index
        })
      }
    })
    return config;
  } catch (err) {
    console.error('无法读取目录内容:', err);
  }
}

async function productDumiConfig(configs) {
  let configJSON = [];
  configs.forEach(obj => {
    configJSON.push({ title: obj.navTitle, link: obj.navLink });
  });
  const jsons = JSON.stringify(configJSON, null, 2);
  fs.writeFile('./navConfig.json', jsons, 'utf-8', (err) => {
    console.log(err);
  });
}


// 修正代码
async function processFiles() {
  try {
    const configs = await mergeConfig();

    const projectConvertPromiseFn = configs.map(async (item) => {
      try {
        console.log(item)
        await convertDocToMd(item.docPath, item.outputPath);

      } catch (error) {
        console.error('转换时发生错误:', error);
      }
    });

    // 所有doc转换成md完成
    await Promise.all(projectConvertPromiseFn);
    console.log('所有文件转换完成');
    //生成dumi配置
    await productDumiConfig(configs);
    console.log('dumi配置生成完成')
  } catch (error) {
    console.error('处理文件时发生错误:', error);
  }
}
processFiles();