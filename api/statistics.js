let app = require("express")();
let server = require("http").Server(app);
let bodyParser = require("body-parser");
let Datastore = require("nedb");

app.use(bodyParser.json());

module.exports = app;

let statisticsDB = new Datastore({
  filename: process.env.APPDATA+"/POS/server/databases/statistics.db",
  autoload: true
});

statisticsDB.ensureIndex({ fieldName: '_id', unique: true });

app.get("/", function(req, res) {
  res.send("Statistics API");
});

app.get("/sales", function(req, res) {
  statisticsDB.find({}, function(err, docs) {
    res.send(docs);
  });
});

app.get("/sales-by-date", function(req, res) {
  let startDate = new Date(req.query.start);
  let endDate = new Date(req.query.end);

  statisticsDB.find(
    { date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() }},
    function(err, docs) {
      if (docs) res.send(docs);
    }
  );
});

// Add more routes as needed for other statistics

app.post("/new", function(req, res) {
  let newStatistic = req.body;
  statisticsDB.insert(newStatistic, function(err, statistic) {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send("Statistic created successfully.");
  });
});

app.put("/update", function(req, res) {
  let statId = req.body._id;
  statisticsDB.update({_id: statId}, req.body, {}, function(err, numReplaced) {
    if (err) res.status(500).send(err);
    else res.sendStatus(200);
  });
});

app.post("/delete", function(req, res) {
  let statistic = req.body;
  statisticsDB.remove({_id: statistic._id}, function(err, numRemoved) {
    if (err) res.status(500).send(err);
    else res.sendStatus(200);
  });
});

app.get("/:statisticId", function(req, res) {
  statisticsDB.find({_id: req.params.statisticId}, function(err, doc) {
    if (doc) res.send(doc[0]);
  });
});
