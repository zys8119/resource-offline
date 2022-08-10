import {createServer as createServerHttp, RequestListener} from "http"
import {createServer} from "https"
import {existsSync, readFileSync, watch} from "fs"
import {resolve} from "path"

const requestListener:RequestListener = (req, res)=>{
    require("./serve").default(req, res)
}
const app = createServer({
    key:readFileSync(resolve(__dirname,'./localhost.key')),
    cert:readFileSync(resolve(__dirname,'./localhost.crt')),
},requestListener)
app.listen(443,()=>{
    console.log("http://127.0.0.1:80")
    console.log("https://127.0.0.1:443")
    watch(process.cwd(),{
        recursive:true
    },(t,f)=>{
        const file_path = resolve(process.cwd(),f);
        if(require.cache[file_path] && existsSync(file_path)){
            delete require.cache[file_path];
        }
    })
})
createServerHttp(requestListener).listen(80)
