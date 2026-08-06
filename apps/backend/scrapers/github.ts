import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent"; // 👈 Import the agent
const proxyUrl='http://slmkyugx:a2ewhnvyrvau@31.59.20.176:6754'
const agent= new HttpsProxyAgent(proxyUrl)
export async function scrapegithub(username:string){
 const userRepos=await axios.request({url:`https://api.github.com/users/${username}/repos`,httpAgent:agent})
    // const userRepos=await axios.get(`https://api.github.com/users/${username}/repos`,{
    //     proxy:{
    //           host: '31.59.20.176',
    //           port: 6754,
    //           auth: {
    //             // free plan address from webshare so no point of stealing it
    //             username:'slmkyugx',  
    //             password:'a2ewhnvyrvau'
    //           },
    //           protocol: 'http'
    //     }
    // });
    return userRepos.data.map((x:any)=>({
        description:x.description,
        name:x.name,
        fullname:x.full_name,
        starCount:x.stargazers_count

    }))
}