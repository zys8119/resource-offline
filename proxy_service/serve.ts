import {RequestListener} from "http"
import {resolve} from "path"
import {readFileSync, existsSync, writeFileSync} from "fs"
import {merge} from "lodash"
import {HttpHeadersTypeInterface} from "./HttpHeaderConfig"
import {parse} from "node:querystring"
import axios from "axios"
const getPublicHeaders = ()=>{
    return {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Headers":"*",
    } as HttpHeadersTypeInterface
}
export default (async (req,res) => {
    try {
        const url:string = parse(req.url)['/?url'] as string
        const {data, headers, status} = await axios.create()({
            url,
            method:"get",
            responseType:"arraybuffer"
        })
        console.log(status, url)
        res.writeHead(status,  merge(headers as HttpHeadersTypeInterface));
        res.end(data)
    }catch (e) {
        console.error(e)
        res.writeHead(404,  merge(getPublicHeaders(), {"Content-Type": "text/plain"} as HttpHeadersTypeInterface));
        res.end("Not Fund")
    }


}) as RequestListener
