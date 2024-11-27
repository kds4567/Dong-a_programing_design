//repo.js로 옮김. 


const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));


router.get('/', (req,res) => {
    const query = "SELECT Id, Name, Views, Updated FROM repo ORDER BY Views DESC LIMIT 10";
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

