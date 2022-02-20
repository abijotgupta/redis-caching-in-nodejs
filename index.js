import fetch from 'node-fetch';
import express from 'express';
import redis from 'redis';
import { Octokit } from "@octokit/core";

const PORT = process.env.PORT || 7090;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);
const octokit = new Octokit({ auth: `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` });

const app = express();

function setResponse(username, repos) {
    return `<h2>${username} has ${repos} Github repos.</h2>`;
}

//make req to github for data
async function getRepos(req, res, next) {
    try {
        console.log('Fetching data.....');
        const response = await octokit.request(`GET /users/${username}`, {
            username: 'username'
        });
        const { data } = response;
        const repos = data.public_repos;
        client.on('error', (err) => console.log('Redis Client Error', err));

        await client.connect();
        client.setEx(username, 3600, repos);
        await client.quit();
        res.send(setResponse(username, repos));
    } catch (error) {
        console.log(error);
        res.status(500);
    }
}

function cache(req, res, next) {
    const {username} = req.params;
    client.get(username, (err, data) =>{
        if(err) {
            throw err;
        }
        if(data !== null) {
            res.send(setResponse(username, data));
        } else {
            next();
        }
    });
}

app.get('/repos/:username', cache, getRepos);

app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
});