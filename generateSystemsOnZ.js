const { MongoClient, ObjectId} = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017/Bazak");

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

const genSysOnZ = async (systemId, carnumber, systems, cardatas) => {
    const systemToAdd = {
        _id: new ObjectId(),
        systemType: new ObjectId(systemId),
        kashir: true
    };

    const needTipul = Math.random() < 0.6;
    if (!needTipul) {
        await cardatas.updateOne({carnumber}, {$addToSet: {systems: systemToAdd}})
        return;
    }

    systemToAdd.kashir = false;
    const needHH = Math.random() < 0.8;
    const technologyRes = await systems.find({_id: new ObjectId(systemId)}).toArray();
    const technology = technologyRes[0];
    const tipulToAdd = {};
    if (["1", "2"].includes(technology.mashbit)) {
        const options = ["tipul", "harig_tipul", "technology_mizdamenet"];
        const chosenTipul = options[Math.floor(Math.random() * options.length)];
        tipulToAdd.type = chosenTipul;
        tipulToAdd[chosenTipul] = makeid(3);

    }
    else {
        tipulToAdd.type = "technology_mizdamenet";
        tipulToAdd.technology_mizdamenet = makeid(5);
    }
    if (needHH){
        tipulToAdd["hh_stands"] = [{
            missing_makat_1: makeid(7),
            missing_makat_2: Math.floor(Math.random() * 999).toFixed()
        }]
    }

    const create = {$addToSet: {tipuls: tipulToAdd, systems: systemToAdd}};
    const updates = [];
    if (technology.mashbit == "1")
        updates.push({$set: {kshirot:"לא כשיר"}})
    if (technology.mashbit == "2")
        updates.push({$set: {zminot:"לא זמין"}})

    if (["1", "2"].includes(technology.mashbit))
        updates.push({$set: {expected_repair:"עד 6 שעות"}})

    await cardatas.updateOne({carnumber}, create);
    if (updates.length !== 0){
        await cardatas.updateOne({carnumber}, updates);
    }
}

const run = async () => {
    const db = client.db('Bazak');
    const cardatas = db.collection("cardatas");
    const systems = db.collection("systems");
    const systemsToMakats = db.collection("systemstomakats");

    const makatsAndSystemIds = await systemsToMakats.find({}).toArray();
    const tasks = makatsAndSystemIds.map(async (item, i) => {
        const makatId = item.makatId;
        const systemId = item.systemId;
        const carsWithMakat = await cardatas.find({makat: makatId}).toArray();
        const innerTasks = carsWithMakat.map(async (car, i) => {
            console.log("created inner task number " + i);
            return await genSysOnZ(systemId, car.carnumber, systems, cardatas)
        });
        
        return innerTasks;
    });

    const res = await Promise.all(tasks.flat());
    console.log("done");
}
// run()
// .then(
//     () => client.close()
// )
// .catch(console)

client.connect()
.then(async () => {
    await run();
    await client.close()
})