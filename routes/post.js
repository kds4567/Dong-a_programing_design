const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

// 게시물 생성 (Create)
router.post('/', (req, res) => {
    const { Title, Content } = req.body;
    const Author = req.session.user ? req.session.user.Name : null;

    console.log('Title:', Title); // 제목 확인
    console.log('Content:', Content); // 내용 확인
    console.log('Author:', Author); // 작성자 확인

    const query = 'INSERT INTO post (Title, Content, Author) VALUES (?, ?, ?)';

    req.db.query(query, [Title, Content, Author], (err, results) => {
        if (err) {
            console.error('Error inserting post:', err.stack);
            return res.status(500).send('Error inserting post');
        }
        res.redirect('/post'); // 게시물 목록 페이지로 리디렉션
    });
});


// 게시물 목록 조회 (Read)
router.get('/', (req, res) => {

    const query = `
        SELECT
            Id,
            Title,
            Content,
            Author,
            DATE_FORMAT(Created, '%Y-%m-%d %H:%i') AS Created,
            DATE_FORMAT(Updated, '%Y-%m-%d %H:%i') AS Updated
        FROM
            post
    `;


    req.db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching post:', err.stack);
            return res.status(500).send('Error fetching post');
        }
        res.render('post', { post: results, user: req.session.user });
    });
});

// 게시물 수정 (Update)
router.post('/:id', (req, res) => {
    const { Title, Content } = req.body;
    const { id } = req.params;
    const query = 'UPDATE post SET Title = ?, Content = ?, Updated = CURRENT_TIMESTAMP WHERE Id = ?';

    req.db.query(query, [Title, Content, id], (err, results) => {
        if (err) {
            console.error('Error updating post:', err.stack);
            return res.status(500).send('Error updating post');
        }
        res.redirect('/post'); // 게시물 목록 페이지로 리디렉션
    });
});

// 게시물 삭제 (Delete)
router.post('/delete/:id', (req, res) => {
    const { id } = req.params;

    const selectQuery = 'SELECT Title FROM post WHERE Id = ?';

    req.db.query(selectQuery, [id], (err, results) => {
        if (err) {
            console.error('Error fetching post title:', err.stack);
            return res.status(500).send('Error fetching post title');
        }

        if (results.length === 0) {
            return res.status(404).send('Post not found');
        }

        const Title = results[0].Title;

        const deleteQuery = 'DELETE FROM post WHERE Id = ? AND Title = ?';

        req.db.query(deleteQuery, [id, Title], (err, results) => {
            if (err) {
                console.error('Error deleting post:', err.stack);
                return res.status(500).send('Error deleting post');
            }
            res.redirect('/post');
        });
    });
});


module.exports = router;
