import axios from "axios";

export async function scrapegithub(username:string){
    const userRepos=await axios.get(`https://api.github.com/users/${username}/repos`);
    return userRepos.data.map((x:any)=>({
        description:x.description,
        name:x.name,
        fullname:x.full_name,
        starCount:x.stargazers_count

    }))
}