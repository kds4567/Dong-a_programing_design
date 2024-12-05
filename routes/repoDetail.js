const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

let currentFilePath = '';

// 요구 사항 분석
router.post('/requirements', (req, res) => {
    const content = req.body.content; // 입력받은 설계 코드
    const lines = content.split('\n'); // 줄 단위로 분리
    let errors = []; // 에러 목록

    // 하드코딩된 의존성
    const correctDependencies = {
        "컴1": [],
        "컴2": ["컴1"],
        "컴3": ["컴1", "컴2"],
        "컴4": ["컴1", "컴3"],
        "컴5": ["컴1", "컴4"],
        "user": ["컴5"]
    };

    // 정의된 컴포넌트를 추적
    const definedComponents = new Set();

    // 컴포넌트 분석 함수
    const parseLine = (line) => {
        const match = line.match(/^(컴\d+|user)\s*:\s*.+?(?:\^\(([^)]+)\))?$/);
        if (!match) {
            return { error: `잘못된 형식: "${line}"` };
        }
        const [, name, dependencies] = match;
        const dependenciesList = dependencies ? dependencies.split(',').map(dep => dep.trim()) : [];
        return { name, dependencies: dependenciesList };
    };

    // 입력 분석 및 검증
    lines.forEach((line, index) => {
        line = line.trim();
        if (!line) return; // 빈 줄 스킵

        const parsed = parseLine(line);
        if (parsed.error) {
            errors.push(`줄 ${index + 1}: ${parsed.error}`);
        } else {
            const { name, dependencies } = parsed;

            // 컴포넌트 정의 기록
            definedComponents.add(name);

            // 하드코딩된 의존성과 비교
            if (!correctDependencies[name]) {
                errors.push(`"${name}"는 허용되지 않는 컴포넌트입니다.`);
            } else {
                const correctDeps = correctDependencies[name];
                const missingDeps = correctDeps.filter(dep => !dependencies.includes(dep));
                if (missingDeps.length > 0) {
                    errors.push(
                        `"${name}"의 의존성 ${missingDeps.map(dep => `"${dep}"`).join(', ')}가 누락되었습니다.`
                    );
                }
            }
        }
    });

    // 정의되지 않은 컴포넌트 확인
    Object.entries(correctDependencies).forEach(([name, dependencies]) => {
        dependencies.forEach(dep => {
            if (!definedComponents.has(dep)) {
                errors.push(`"${dep}"가 정의되지 않았습니다.`);
            }
        });
    });

    // 최종 결과 반환
    if (errors.length === 0) {
        res.send({ status: "문제 없음", answer: null });
    } else {
        res.send({ status: "문제 있음", answer: errors.join('\n') });
    }
});


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
    currentRepoId = repoId;

    const repoQuery = `
        SELECT r.Name, r.Created, r.Updated, r.Views, u.Name AS OwnerName
        FROM repo r 
        JOIN user u ON r.Owner_id = u.Id 
        WHERE r.Id = ?`;

    const filesQuery = `
        SELECT File_name, Path, Created_at, Updated_at 
        FROM file 
        WHERE Repo_id = ?`;

    const updateViewsQuery = `
        UPDATE repo 
        SET Views = Views + 1 
        WHERE Id = ?`;

    const currentview = 'INSERT INTO recent_view (user_id, post_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP';

    try {
        console.log('요청된 레퍼지토리 ID :', repoId);

        // 조회수 증가 쿼리 실행
        await new Promise((resolve, reject) => {
            req.db.query(updateViewsQuery, [repoId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        const repoInfo = await new Promise((resolve, reject) => {
            req.db.query(repoQuery, [repoId], (err, result) => {
                if (err) reject(err);
                if (result.length === 0) return reject(new Error('해당 레포지토리를 찾을 수 없습니다.'));
                resolve(result[0]);
            });
        });

        // 세션에서 현재 사용자 ID와 이름 가져오기
        const currentUserId = req.session.user ? req.session.user.Id : null; // 사용자 ID
        const currentUsername = req.session.user ? req.session.user.Name : 'Guest'; // 기본값 설정
        console.log(currentUsername);

        // 레포지토리의 주인과 비교
        const isOwner = currentUsername === repoInfo.OwnerName;

        const files = await new Promise((resolve, reject) => {
            req.db.query(filesQuery, [repoId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        if(files[0] != null){
            currentFilePath = files[0].Path;
        }
        console.log(currentFilePath);
        const readmeFile = files.find(file => file.File_name === 'README.md');
        const initialFilePath = readmeFile ? readmeFile.Path : null;

        // 현재 사용자와 레포지토리 ID를 사용하여 recent_views에 삽입
        if (currentUserId) {
            await new Promise((resolve, reject) => {
                req.db.query(currentview, [currentUserId, repoId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        }

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

// storage 설정: 업로드된 파일의 경로와 이름을 지정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 업로드 파일의 저장 경로를 currentFilePath로 설정
        cb(null, path.dirname(currentFilePath));
    },
    filename: (req, file, cb) => {
        // 파일 이름을 UTF-8로 변환하여 저장
        const utf8FileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, utf8FileName); // 예: 'hi.txt'
    }
});

// multer 설정
const upload = multer({
    storage: storage, // storage 설정을 사용
    limits: { fileSize: 10 * 1024 * 1024 } // 파일 크기 제한 (10MB)
}).single('file'); // 업로드할 파일은 'file' 필드로 받기

// 업로드 라우터
router.post('/upload-file', upload, (req, res) => {
    const { repoId } = req.body; // 요청 본문에서 repoId 추출
    const file = req.file;

    // 파일 업로드 여부 확인
    if (!file) {
        return res.status(400).send('파일을 선택해주세요.');
    }

    // 파일 이름과 경로 설정
    const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const filePath = path.join(path.dirname(currentFilePath), fileName);

    console.log(`upload 파일 경로: ${filePath}`);

    // 파일 정보를 데이터베이스에 저장
    const insertFileQuery = `
        INSERT INTO file (File_name, Path, Repo_id)
        VALUES (?, ?, ?)
    `;

    req.db.query(insertFileQuery, [fileName, filePath, repoId], (err, result) => {
        if (err) {
            console.error('파일 데이터베이스 저장 오류:', err);
            return res.status(500).send('파일 업로드 중 오류가 발생했습니다.');
        }

        console.log(`파일 업로드 경로: ${filePath}`);
        res.send('파일이 성공적으로 업로드되었습니다.');
    });
});

// 파일 생성 라우터
router.post('/create-file', (req, res) => {
    let { repoId, fileName, filePath } = req.body;

    if(!fileName.endsWith('.txt')){
        fileName += '.txt';
    }
    // 저장할 디렉토리 경로 (예: 리포지토리 내부의 디렉토리 경로)
    const directoryPath = path.dirname(filePath);
    console.log('새로운 파일을 저장할 경로 : ', directoryPath);

    // 파일이 이미 존재하는지 확인
    if (fs.existsSync(path.join(directoryPath, fileName))) {
        return res.status(400).send('파일이 이미 존재합니다.');
    }


    // 파일 생성
    fs.writeFile(path.join(directoryPath, fileName), '', (err) => {
        if (err) {
            return res.status(500).send('파일 생성 실패');
        }

        const query = `INSERT INTO file (Repo_id, File_name, Path) VALUES (?, ?, ?)`;
        req.db.query(query, [repoId, fileName, path.join(directoryPath, fileName)], (err, result) => {
            if(err){
                console.error('파일 생성 DB 업데이트 실패.', err);
                return res.status(500).send('파일 생성 후 DB 업데이트 실패');
            }
        })


        res.status(200).send('파일 생성 성공');
    });
});

module.exports = router;