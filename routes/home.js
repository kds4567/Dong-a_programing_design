const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

// 홈 페이지
router.get('/', (req, res) => {
    // 세션 정보 사용하는 법.
    // req.session.user.?
    // req.session.user 안에는 로그인한 유저의 db정보가 들어있음 (Id, Password, ....)
    const ownerId = req.session.user ? req.session.user.Id : null;
    const query1 = 'SELECT Name FROM repo WHERE Owner_id = ?';

    // 아래 처럼 db쿼리 사용 가능(req.db)
    req.db.query(query1, [ownerId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).send('Error executing query');
        }
        res.render('home', { data: results, user: req.session.user });
    });
});

// 레포지토리 생성 처리 (????)
router.post('/createrepo', (req, res) => {
    const repoName = req.body.Name;
    const ownerId = req.session.user ? req.session.user.Id : null;

    if (!ownerId) {
        return res.status(401).send('사용자가 로그인하지 않았습니다.');
    }

    const query = 'INSERT INTO repo (Name, Owner_id, Created, Updated) VALUES (?, ?, NOW(), NOW())';

    req.db.query(query, [repoName, ownerId], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).send('데이터베이스에 레코드를 생성하는 데 실패했습니다.');
        }
        res.redirect('/');
    });
});

// 프로필 페이지
router.get('/profile', (req, res) => {
    if (req.session.user) {
        res.send(`안녕하세요, ${req.session.user.Username}! <a href="/logout">Logout</a>`);
    } else {
        res.send('로그인 해주세요! <a href="/login">Login</a>');
    }
});
router.get('/share', (req,res) => {
    const query = "SELECT Name, Views, Updated FROM repo ORDER BY Views DESC LIMIT 10"
    const queryPromise = new Promise((resolve, reject) => {
            req.db.query(query, (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
    });
    Promise.all([queryPromise]).then(([results]) => {
            res.render('share',{ data: results })
    })
    .catch(err => {
            console.error('Error executing query:', err.stack);
            res.status(500).send('Error executing query');
    });

});

module.exports = router;