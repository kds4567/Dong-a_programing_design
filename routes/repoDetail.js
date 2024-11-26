const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// 파일 내용 반환 라우터 (보안 강화 및 경로 확인 추가)
router.get('/file-content', (req, res) => {
    console.log("파일 선택함");

    // query로 받은 경로를 안전하게 처리 (절대 경로로 변환)
    const filePath = req.query.path;

    // 파일 존재 여부 확인
    fs.exists(filePath, (exists) => {
        if (!exists) {
            console.error('파일이 존재하지 않습니다:', filePath);
            return res.status(404).send('파일이 존재하지 않습니다.');
        }

        // 파일이 존재하면 내용 읽기
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('파일 읽기 오류:', err);
                return res.status(500).send('파일을 읽는 중 오류가 발생했습니다.');
            }
            res.setHeader('Content-Type', 'text/plain');  // 텍스트 파일로 응답 설정
            res.send(data);  // 파일 내용 전송
        });
    });
});

// 특정 repo의 상세 정보 및 파일 목록
router.get('/:id', async (req, res) => {
    const repoId = req.params.id;

    const repoQuery = `
        SELECT r.Name, r.Created, r.Updated, r.Views, u.Name AS OwnerName
        FROM repo r 
        JOIN user u ON r.Owner_id = u.Id 
        WHERE r.Id = ?`;

    const filesQuery = `
        SELECT File_name, Path, Created_at, Updated_at 
        FROM file 
        WHERE Repo_id = ?`;

    try {
        console.log('요청된 레퍼지토리 ID :', repoId);
        const repoInfo = await new Promise((resolve, reject) => {
            req.db.query(repoQuery, [repoId], (err, result) => {
                if (err) reject(err);
                if (result.length === 0) return reject(new Error('해당 레포지토리를 찾을 수 없습니다.'))
                resolve(result[0]);
            });
        });

        // 세션에서 현재 사용자 이름 가져오기
        const currentUsername = req.session.user.Name;
        console.log(currentUsername);

        // 레포지토리의 주인과 비교
        const isOwner = currentUsername === repoInfo.OwnerName;

        const files = await new Promise((resolve, reject) => {
            req.db.query(filesQuery, [repoId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        const readmeFile = files.find(file => file.File_name === 'README.md');
        const initialFilePath = readmeFile ? readmeFile.Path : null;

        res.render('repoDetail', {
            repoName: repoInfo.Name,
            ownerName: repoInfo.OwnerName,
            created: repoInfo.Created_at,
            updated: repoInfo.Updated_at,
            views: repoInfo.Views + 1,
            files: files.map(file => ({
                ...file,
                isFolder: !file.File_name.includes('.'), // 파일과 폴더 구분
            })),
            isOwner: isOwner,  // 주인 여부를 클라이언트로 전달
            repoId: repoId,
            initialFilePath: initialFilePath
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('오류 발생');
    }
});


// 파일 수정 API
router.post('/edit-file', (req, res) => {
    const { filePath, content } = req.body;

    console.log('파일 경로:', filePath);
    console.log('파일 내용:', content);

    if (!filePath || content === undefined) {
        return res.status(400).send('filePath와 content를 제공해야 합니다.');
    }

    fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
            console.error('파일 쓰기 오류:', err);
            return res.status(500).send('파일 저장 중 오류가 발생했습니다.');
        }
        res.send('파일이 성공적으로 저장되었습니다.');
    });
});

// 파일 삭제 API
router.delete('/delete-file', (req, res) => {
    const { filePath, repoId } = req.body;

    console.log('삭제할 파일 경로:', filePath);
    console.log('삭제할 파일의 repoId:', repoId);

    if (!filePath || !repoId) {
        return res.status(400).send('filePath와 repoId를 제공해야 합니다.');
    }

    // 1. 파일 삭제
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('파일 삭제 오류:', err);
            return res.status(500).send('파일 삭제 중 오류가 발생했습니다.');
        }

        // 2. 데이터베이스에서 해당 파일 레코드 삭제
        const deleteFileQuery = `
            DELETE FROM file
            WHERE Path = ? AND Repo_id = ?
        `;

        req.db.query(deleteFileQuery, [filePath, repoId], (err, result) => {
            if (err) {
                console.error('파일 삭제 데이터베이스 오류:', err);
                return res.status(500).send('파일 레코드 삭제 중 오류가 발생했습니다.');
            }

            res.send('파일이 성공적으로 삭제되었습니다.');
        });
    });
});

// 레포지토리 삭제 API
router.delete('/delete-repo', (req, res) => {
    const { repoId } = req.body;

    console.log('삭제할 레포지토리 ID:', repoId);

    if (!repoId) {
        return res.status(400).send('repoId를 제공해야 합니다.');
    }

    // 1. 레포지토리의 파일들을 삭제
    const deleteFilesQuery = `
        DELETE FROM file
        WHERE Repo_id = ?
    `;

    req.db.query(deleteFilesQuery, [repoId], (err) => {
        if (err) {
            console.error('파일 삭제 오류:', err);
            return res.status(500).send('파일 삭제 중 오류가 발생했습니다.');
        }

        // 2. 레포지토리 삭제
        const deleteRepoQuery = `
            DELETE FROM repo
            WHERE Id = ?
        `;

        req.db.query(deleteRepoQuery, [repoId], (err) => {
            if (err) {
                console.error('레포지토리 삭제 오류:', err);
                return res.status(500).send('레포지토리 삭제 중 오류가 발생했습니다.');
            }

            res.send('레포지토리가 성공적으로 삭제되었습니다.');
        });
    });
});



module.exports = router;