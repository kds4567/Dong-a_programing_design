const express = require('express');
const router = express.Router();

// 게시물 목록 페이지
router.get('/', (req, res) => {
    const query = `
        SELECT Id, Title, Content, Author,
               DATE_FORMAT(Created, '%Y-%m-%d %H:%i') AS Created
        FROM post`;

    req.db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching posts:', err.stack);
            return res.status(500).send('Error fetching posts');
        }
        res.render('postList', { post: results, user: req.session.user });
    });
});

// 게시물 상세 페이지
router.get('/:title', (req, res) => {
    const User = req.session.user ? req.session.user : null;
    const Title = req.params.title;
    const postQuery = "SELECT * FROM post WHERE Title = ?";
    const repoQuery = "SELECT * FROM repo WHERE Id = ?"; // Author_Repo에 해당하는 쿼리

    const postPromise = new Promise((resolve, reject) => {
        req.db.query(postQuery, [Title], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

    postPromise
        .then((results) => {
            if (results.length === 0) {
                return res.status(404).send('Post not found');
            }

            const post = results[0]; // 배열에서 첫 번째 게시물을 사용
            const authorRepoId = post.Author_Repo;

            return new Promise((resolve, reject) => {
                req.db.query(repoQuery, [authorRepoId], (err, repoResults) => {
                    if (err) reject(err);
                    else resolve({ post, repo: repoResults[0] }); // 데이터 합쳐서 반환
                });
            });
        })
        .then(({ post, repo }) => {
            res.render('post', { data: [post], repo, user: User }); // repo를 단일 객체로 전달
        })
        .catch((err) => {
            console.error('Error executing query:', err.stack);
            res.status(500).send('Error executing query');
        });
});

// 게시물 작성 페이지
router.get('/new/:id', (req, res) => {
    const Repo_Id = req.params.id;
    const query = 'SELECT Name From repo WHERE Id = ?';

    req.db.query(query, [Repo_Id], (err, results) => {
        if(err){
            console.error('Error executing query:', err);
        }
        else{
            return res.render('postNew',{ name : results[0].Name, id : Repo_Id});
        }
    });
});

// 게시물 작성 처리
router.post('/new/:id', (req, res) => {
    const { Title, Content } = req.body;
    const Repo_Id = req.params ? req.params.id : null;
    const Author = req.session.user ? req.session.user.Id : null;
    let Repo_Name = null;

    const query1 = "SELECT Name FROM repo WHERE Id = ?";
    req.db.query(query1, [Repo_Id], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Error fetching repository name'); // 에러 처리
        }
        if (results.length > 0) {
            Repo_Name = results[0].Name;
            console.log(results[0]);

            const query2 = 'INSERT INTO post (Title, Content, Author, Author_repo) VALUES (?, ?, ?, ?)';
            req.db.query(query2, [Title, Content, Author, Repo_Id], (err) => {
                if (err) {
                    console.error('Error inserting post:', err.stack);
                    return res.status(500).send('Error inserting post');
                }
                res.redirect(`/repo/${Repo_Name}`);
            });
        } else {
            return res.status(404).send('Repository not found');
        }
    });
});

// 게시물 수정 페이지
router.get('/edit/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT Id, Title, Content, Author FROM post WHERE Id = ?';

    req.db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching post:', err.stack);
            return res.status(500).send('Error fetching post');
        }

        if (results.length === 0) {
            return res.status(404).send('Post not found');
        }

        const post = results[0];
        if (req.session.user && req.session.user.Id === post.Author) {
            res.render('postEdit', { post });
        } else {
            res.status(403).send('권한이 없습니다.');
        }
    });
});

// 게시물 수정 처리
router.post('/edit/:id', (req, res) => {
    const { Title, Content } = req.body;
    const { id } = req.params;  // 수정하려는 post의 Id

    // 게시물의 Id가 맞는지 확인하는 쿼리
    const query = 'UPDATE post SET Title = ?, Content = ?, Post_Updated = CURRENT_TIMESTAMP WHERE Id = ?';

    // 쿼리 실행: 해당 게시물의 Id만 수정합니다.
    req.db.query(query, [Title, Content, id], (err) => {
        if (err) {
            console.error('Error updating post:', err.stack);
            return res.status(500).send('Error updating post');
        }
        res.redirect(`/post/${Title}`);
    });
});

// 게시물 삭제 처리
router.post('/delete/:id', (req, res) => {
    const { id } = req.params; // post의 id

    // 게시물의 Author_repo를 찾기 위한 쿼리
    const findQuery = 'SELECT Author_repo FROM post WHERE Id = ?';
    req.db.query(findQuery, [id], (err, results) => {
        if (err) {
            console.error('Error fetching post:', err.stack);
            return res.status(500).send('Error fetching post');
        }
        if (results.length === 0) {
            return res.status(404).send('Post not found');
        }
        const Repo_Id = results[0].Author_repo; // 게시물의 Author_repo

        const repoQuery = 'SELECT Name FROM repo WHERE Id = ?';
        req.db.query(repoQuery, [Repo_Id], (err, repoResults) => {
            if (err) {
                console.error('Error fetching repository name:', err.stack);
                return res.status(500).send('Error fetching repository name');
            }

            if (repoResults.length === 0) {
                return res.status(404).send('Repository not found');
            }

            const Repo_Name = repoResults[0].Name; // 레포지토리 이름

            // 게시물 삭제 쿼리
            const deleteQuery = 'DELETE FROM post WHERE Id = ?';
            req.db.query(deleteQuery, [id], (err) => {
                if (err) {
                    console.error('Error deleting post:', err.stack);
                    return res.status(500).send('Error deleting post');
                }
                // 레포지토리 페이지로 리다이렉트
                res.redirect(`/repo/${Repo_Name}`);
            });
        });
    });
});

module.exports = router;
