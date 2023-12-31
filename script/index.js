const mammoth = require("mammoth");
const fs = require('fs');
const path = require('path');
const turndown = require('turndown');
const constants = require('./config.js');
require('dotenv').config();
const util = require('util');
const { projectConfig, imageFolderPath, positionToInsert, template, imageType } = constants;
//html->md 工具
const turndownService = new turndown();
const readDir = util.promisify(fs.readdir);


let docFileDir = '/var/project/doc_website/docFile';
let targetDir = '/var/project/doc_website/docs/doc_';
let configDir = '/var/project/doc_website/script/navConfig.json';
let mdDir = '/var/project/doc_website/docs';

if (process.env.NODE_ENV === 'development') {
  docFileDir = path.resolve(__dirname, process.env.DEV_DOC_DIR);
  targetDir = path.resolve(__dirname, process.env.DEV_TARGET_DIR);
  configDir = path.resolve(__dirname, process.env.DEV_CONFIG_FILE);
  mdDir = path.resolve(__dirname, process.env.DEV_MD_DIR);
}


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
    //转成html的结果
    let result = null;
    try {
      result = await mammoth.convertToHtml({ path: docPath }, {
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
      });
    } catch (e) {
      console.log(e, 'word转html时发生错误');
    }

    let htmlContent = result.value;
    const html = template.slice(0, positionToInsert) + htmlContent + template.slice(positionToInsert);
    const markdownContent = turndownService.turndown(html);
    await fs.writeFileSync(outputPath + '/index.md', markdownContent, (err) => {
      if (err) {
        console.error('写入发生错误', err);
      } else {
        console.log('Markdown 文件已创建');
      }
    })
  } catch (e) {
    console.log('最后转md时发生错误', e);
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
  try {
    //查找doc目录下的所有word文档
    const files = await readDir(docFileDir);
    files.forEach(file => {
      if (file.endsWith('.docx') || file.endsWith('.doc')) {
        fileNames.push(docFileDir + "/" + file);
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
          outputPath: targetDir + index,
          navTitle: fileNameMatch[1],
          navLink: '/doc_' + index
        })
      }
    });
    return config;
  } catch (err) {
    console.error('合并配置时发生错误:', err);
  }
}

async function productDumiConfig(configs) {
  try {
    let configJSON = [];
    configs.forEach(obj => {
      configJSON.push({ title: obj.navTitle, link: obj.navLink });
    });
    const jsons = JSON.stringify(configJSON, null, 2);
    fs.writeFile(configDir, jsons, 'utf-8', (err) => {
      console.log(err);
    });
  } catch (e) {
    console.log(e, '保存dumi配置时错误')
  }
}

async function init() {

  function deleteFolderContents(folderPath) {
    // 获取文件夹内的所有文件和子文件夹
    const files = fs.readdirSync(folderPath);
  
    // 遍历文件和子文件夹
    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
  
      // 检查文件类型
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        // 删除文件
        fs.unlinkSync(filePath);
      } else if (stats.isDirectory()) {
        // 递归删除子文件夹的内容
        deleteFolderContents(filePath);
        // 删除空的子文件夹
        fs.rmdirSync(filePath);
      }
    });
  }
  
await  deleteFolderContents(mdDir);

}


// 修正代码
async function processFiles() {
  try {
    await init();
    const configs = await mergeConfig();
    const projectConvertPromiseFn = configs.map(async (item) => {
      try {
        await convertDocToMd(item.docPath, item.outputPath);
      } catch (error) {
        console.error('docs->html->md发生错误:', error);
      }
    });

    // 所有doc转换成md完成
    await Promise.all(projectConvertPromiseFn);
    //生成dumi配置
    await productDumiConfig(configs);
  } catch (error) {
    console.error('最终错误:', error);
  }
}
processFiles();