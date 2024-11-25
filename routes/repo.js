const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/:id', async (req, res) => {
    const repoId = req.params.id;

    const repoQuery = `
        SELECT r.Name, r.Created, r.Updated, r.Views, u.Username AS OwnerName
        FROM repo r 
        JOIN user u ON r.Owner_id = u.Id 
        WHERE r.Id = ?`;

    const filesQuery = `
        SELECT File_name, Path, Created_at, Updated_at 
        FROM file 
        WHERE Repo_id = ?`;

    try {
        const repoInfo = await new Promise((resolve, reject) => {
            req.db.query(repoQuery, [repoId], (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        });

        const files = await new Promise((resolve, reject) => {
            req.db.query(filesQuery, [repoId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        res.render('repoDetail', {
            repoName: repoInfo.Name,
            ownerName: repoInfo.OwnerName,
            created: repoInfo.Created_at,
            updated: repoInfo.Updated_at,
            views: repoInfo.Views + 1,
            files: files.map(file => ({
                ...file,
                isFolder: !file.File_name.includes('.'), // 간단한 파일/폴더 구분 (예: '.'이 없으면 폴더로 간주)
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('오류 발생');
    }
});

router.get('/file-content', (req, res) => {
    const filePath = req.query.path;

    // 안전한 파일 경로 생성 (예: '../repos/1/README.md')
    const absolutePath = path.join(__dirname, '..', filePath);

    fs.readFile(absolutePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('파일을 읽는 중 오류가 발생했습니다.');
        }
        res.send(data);
    });
});




module.exports = router;
