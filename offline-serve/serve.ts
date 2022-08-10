import {RequestListener} from "http"
import {resolve} from "path"
import {readFileSync, existsSync} from "fs"
import {merge} from "lodash"
import {HttpHeadersTypeInterface} from "./HttpHeaderConfig"
import {parse} from "node:querystring"
import axios from "axios";
import {mkdirSync, writeFileSync} from "fs-extra";
const getPublicHeaders = ()=>{
    return {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Headers":"*",
    } as HttpHeadersTypeInterface
}

/**
 * 是否开启离线模式：true 开启 false 资源缓存
 */

const offine = true

export default (async (req,res) => {
    const url= `https://${req.headers.host}${req.url}`
    const rootDir = resolve(__dirname, 'resources')
    const configPath = resolve(rootDir,'config.json')

    if(offine){
        try {
            if(/amap\.com\//.test(url)){
                console.log(url)
                let config = {}
                const configPath = resolve(rootDir,'config.json')
                if(existsSync(configPath)){
                    try {
                        config = JSON.parse(readFileSync(configPath,"utf8"))
                    }catch (e){
                        //
                    }
                }
                const keyName = url.replace(/callback=jsonp_.+_.+_/,"").replace(/&$/,"")
                const conf = config[keyName] || config[Object.keys(config).find(e=>[
                    // 处理包含时间戳的接口，防止加载失败
                    /v3\/log\/init/
                ].some(ee=>ee.test(e)))]
                if(conf){
                    delete conf.headers["content-length"]
                    res.writeHead(200, conf.headers as HttpHeadersTypeInterface);
                    let buffer:any = readFileSync(resolve(__dirname, 'resources', conf.dirs.join("/"), conf.fileName))
                    const query = parse(url)
                    if(query.callback){
                        buffer = buffer.toString("utf8")
                        buffer = buffer.replace(/jsonp_[^_]*_[^_]*_/g, query.callback)
                    }
                    res.end(buffer)
                }else {
                    res.writeHead(404,  merge(getPublicHeaders(), {"Content-Type": "text/plain"} as HttpHeadersTypeInterface));
                    res.end("Not Fund")
                }
            }else {
                res.writeHead(404,  merge(getPublicHeaders(), {"Content-Type": "text/plain"} as HttpHeadersTypeInterface));
                res.end("Not Fund")
            }
        }catch (e) {
            console.error(e)
            res.writeHead(404,  merge(getPublicHeaders(), {"Content-Type": "text/plain"} as HttpHeadersTypeInterface));
            res.end("Not Fund")
        }
    }else {
        // todo 资源缓存
        try {
            const {data,headers, status} = await axios({
                // 请设置为 proxy_service 地址
                url:'http://localhost:9000',
                method:"get",
                params:{
                    url
                },
                responseType:"arraybuffer"
            })
            /// 资源缓存
            const url_match= url.match(/https:\/\/([^?]+).amap.com([^?]+)/)
            const keyName = url.replace(/callback=jsonp_.+_.+_/,"").replace(/&$/,"")
            const dirs = (url_match[1]+'/'+url_match[2]).split("/").filter(e=>e)
            const conf = {
                dirs:dirs.slice(0, dirs.length -1),
                fileName:Date.now().toString(),
                url:url,
                headers:headers,
            }

            const fileDir = resolve(rootDir,conf.dirs.join("/"))
            // 创建目录
            mkdirSync(fileDir,{recursive:true})
            // 写入缓存文件
            writeFileSync(resolve(fileDir, conf.fileName), data)
            //
            // 写入配置

            let config = {}
            if(existsSync(configPath)){
                try {
                    config = JSON.parse(readFileSync(configPath,"utf8"))
                }catch (e){
                    //
                }
            }
            config[keyName] = conf
            writeFileSync(configPath, JSON.stringify(config, null, 4))
            // 资源响应
            res.writeHead(status, merge(headers as HttpHeadersTypeInterface))
            res.end(data)
        }catch (e) {
            console.error(e)
            res.writeHead(404,  merge(getPublicHeaders(), {"Content-Type": "text/plain"} as HttpHeadersTypeInterface));
            res.end("Not Fund")
        }
    }
}) as RequestListener
