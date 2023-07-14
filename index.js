import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();


const args = process.argv.slice(2);
const config = new Configuration({
    apiKey: process.env.apikey,
    basePath: process.env.apipath || 'https://ai.yunwuu.cn/v1'
})


const ai = new OpenAIApi(config);


async function getEpInfo(epName) {
    const chatCompletion = await ai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {role: "user", content: "我希望你扮演智能影视剧文件名简化器。我会给你一段影视剧集的文件名,我希望你提取出影视剧的名称（通常在文件名的开头）,季数,集数和文件扩展名,然后通过JSON的格式回答我。你的回答只应该包含JSON数据,不要有任何其他数据,也不要做任何解释。你应该使用`name`来表示影视剧名称，`season`表示季数，`episode`表示集数, `type`表示扩展名。如果季数和集数小于10, 你应该在前面补上0来补足为两位。剧集名中的单词应当保持全部首字母大写, 介词如`of`可以除外, 单词间的空格保持为1个。"},
            {role: "user", content: epName}
        ],
    });
    return JSON.parse(chatCompletion.data.choices[0].message.content);
}


const dir = args[0];
if (!dir) throw new Error('No dir.');


async function readDirectory(directoryPath) {
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        console.error('读取目录失败:', err);
        return;
      }
  
      files.forEach(file => {
        const filePath = path.join(directoryPath, file);
        getEpInfo(file).then(data => {
            if (data.name && data.season && data.episode && data.type) {
                const newPath = path.join(directoryPath, `${data.name}_S${data.season}E${data.episode}.${data.type}`);
                console.log(`${filePath} ---> ${newPath}`);
                fs.rename(filePath, newPath, (err) => {
                    if (err)
                      console.log(err);
                });
            }
            else {
                console.log(`${filePath} cannot be renamed!`);
            }
        })
      });
    });
}


readDirectory(dir);

