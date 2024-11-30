const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const path = require('path');
const fs = require('fs');


router.use(bodyParser.urlencoded({ extended: true }));

// 홈 페이지
router.get('/', (req, res) => {
    // 세션 정보 사용하는 법.
    // req.session.user.?
    // req.session.user 안에는 로그인한 유저의 db정보가 들어있음 (Id, Password, ....)
    const message = req.session.message;
    delete req.session.message; // 메시지 사용 후 삭제
    const ownerId = req.session.user ? req.session.user.Id : null;
    const query1 = 'SELECT Id, Name FROM repo WHERE Owner_id = ?';

    // 아래 처럼 db쿼리 사용 가능(req.db)
    req.db.query(query1, [ownerId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).send('Error executing query');
        }
        res.render('home', { data: results, user: req.session.user, message });
    });
});

// 레포지토리 생성 처리
router.post('/createrepo', async (req, res) => {
    const repoName = req.body.Name;
    const ownerId = req.session.user ? req.session.user.Id : null;

    // 사용자 인증 확인
    if (!ownerId) {
        return res.status(401).send('사용자가 로그인하지 않았습니다.');
    }

    const insertRepoQuery = "INSERT INTO repo (Name, Owner_id) VALUES (?, ?)";
    const checkRepoExistsQuery = "SELECT * FROM repo WHERE Name = ? AND Owner_id = ?";
    const insertFileQuery = `
        INSERT INTO file (Repo_id, File_name, Path, Created_at, Updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
    `;

    try {
        // 1. 레포지토리 이름 중복 확인
        const existingRepo = await new Promise((resolve, reject) => {
            req.db.query(checkRepoExistsQuery, [repoName, ownerId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        if (existingRepo.length > 0) {
            return res.status(400).send('이미 존재하는 레포지토리 이름입니다.');
        }

        // 2. 데이터베이스에 레포지토리 정보 삽입
        const result = await new Promise((resolve, reject) => {
            req.db.query(insertRepoQuery, [repoName, ownerId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        const repoId = result.insertId; // 새로 생성된 레포지토리 ID

        // 3. 파일 시스템에 디렉토리 생성
        const repoPath = path.join(__dirname, `../repos/${ownerId}/${repoName}`);
        fs.mkdirSync(repoPath, { recursive: true });

        // 4. 기본 파일 생성 (README.md)
        const readmeName = "README.md";
        const readmePath = path.join(repoPath, readmeName);
        const readmeContent = `# ${repoName}\n\n이 레포지토리는 ${req.session.user.Username}에 의해 생성되었습니다.`;
        fs.writeFileSync(readmePath, readmeContent);

        // 5. 파일 정보를 file 테이블에 삽입
        const filePathForDB = readmePath; // DB에 저장할 파일 경로
        await new Promise((resolve, reject) => {
            req.db.query(insertFileQuery, [repoId, readmeName, filePathForDB], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // 성공 응답

        req.session.message = '레포지토리가 성공적으로 생성되었습니다!';
        res.redirect('/myrepo');    
    } catch (err) {
        console.error('레포지토리 생성 중 오류: ', err);
        res.status(500).send('레포지토리 생성 중 오류가 발생했습니다.');
    }
});

// 프로필 페이지
router.get('/profile', (req, res) => {
    if (req.session.user) {
        res.send(`안녕하세요, ${req.session.user.Username}! <a href="/logout">Logout</a>`);
    } else {
        res.send('로그인 해주세요! <a href="/login">Login</a>');
    }
});



module.exports = router;