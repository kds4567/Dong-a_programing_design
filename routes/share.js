//repo.js로 옮김. 


const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));


router.get('/', (req,res) => {
    const ownerId = req.session.user ? req.session.user.Id : null;
    const query = "SELECT Id, Name, Views, Updated FROM repo ORDER BY Views DESC LIMIT 9";
    const query1 = 'SELECT Id, Name FROM repo WHERE Owner_id = ?';

    const queryPromise = new Promise((resolve, reject) => {
        req.db.query(query, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
    const query2Promise = new Promise((resolve, reject) => {
        req.db.query(query1,[ownerId], (err, results2) => {
            if (err) reject(err);
            else resolve(results2);
            });
    });

    Promise.all([queryPromise, query2Promise]).then(([results, results2]) => {
        res.render('share',{ data: results, data2: results2, user:  req.session.user });
    })
        .catch(err => {
            console.error('Error executing query:', err.stack);
            res.status(500).send('Error executing query');
        });

    });


module.exports = router;

