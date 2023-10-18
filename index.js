const mongoose = require('mongoose');

const systemOnCarSubSchema = new mongoose.Schema({
    systemType: mongoose.Types.ObjectId,
    kashir: Boolean,

});

const cardataSchema = new mongoose.Schema({
    carnumber: { type: String },
    //cartype
    makat: { type: String }, //object
    //
    family: { type: String },
    //units
    gdod: { type: String }, //object
    //
    pluga: { type: String },
    shabzak: { type: String },
    mikum_bimh: { type: String },
    stand: { type: String },
    status: { type: String },
    //
    zminot: { type: String },
    kshirot: { type: String },
    tipuls: { type: Array },
    takala_info: { type: String },
    //
    mikum: { type: String },
    expected_repair: { type: String },
    latest_recalibration_date: { type: Date },
    updatedBy: { type: String },
    // 
    systems: [systemOnCarSubSchema]
}, { timestamps: true });


const Cardata = mongoose.model('Cardata', cardataSchema);


const systemonzSchema = new mongoose.Schema({
    id:{type:String},
    carnumber:{type:String},
    kshirot:{type:String},
    takala_info: { type: String },
    expected_repair: { type: String },
    systemType:{type:String},
}, { timestamps: true });

const SystemsOnZ= mongoose.model('SystemsOnZ', systemonzSchema);


const onConnection = async () => {

    const results = await Cardata.find({});
    await Promise.all(results.map(async (result) => {
        const carnumber = result.carnumber;
        const systemResults = await SystemsOnZ.find({carnumber});

        if (systemResults.length === 0) 
            return;

            await Promise.all(systemResults.map(async (systemResult) => {
            const systemKshirot = systemResult.kshirot === "כשיר";
            const systemType = systemResult.systemType;

            let modified = false;

            // creating an array for every item even if it doesnt exist
            if (!result.systems){
                result.systems = [];
                modified = true;
            }

            const exists = result.systems.some((item) => item.systemType.equals(systemType));

            if (!exists){
                const newSystem = {_id: new mongoose.mongo.ObjectId(), systemType, kashir: systemKshirot};
                result.systems.push(newSystem);
                modified = true;
            }

            if (modified)
                await result.updateOne({systems: result.systems});
            }))
        }));
    }


const reverse = async () => {
    const cardatas = await Cardata.find({});

    await Promise.all(cardatas.map(async (cardata) => {
        if (cardata.systems && cardata.systems.length > 0){
            await cardata.updateOne({systems: []})
        }
    }));
}


mongoose.connect("mongodb://localhost:27017/Bazak")
.then(reverse)
.then(() => mongoose.connection.close());