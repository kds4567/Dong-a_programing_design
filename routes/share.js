const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));


// 특정 repo 페이지 라우팅
router.get('/:name', async (req, res) => {
    const repoName = req.params.name;
    const query1 = "UPDATE repo SET Views = Views + 1 WHERE Name = ?";
    const query2 = "SELECT * FROM repo WHERE Name = ?";
    console.log(repoName);

    const query1Promise = new Promise ((resolve, reject) => {
        req.db.query(query1,[repoName], (err, results1) =>{
            if (err) reject(err);
            else resolve(results1);
        });
    });
    const query2Promise = new Promise ((resolve, reject) => {
        req.db.query(query2,[repoName], (err, results2) =>{
            if (err) reject(err);
            else resolve(results2);
        });
    });
    Promise.all([query1Promise, query2Promise]).then(([results1, results2]) => {
        res.render('repo',{ data1: results1, data2: results2[0] })
})
.catch(err => {
        console.error('Error executing query:', err.stack);
        res.status(500).send('Error executing query');
});
});

module.exports = router;
