// const mongoose = require("mongoose");
// const { Schema } = mongoose;
// const ObjectId = Schema.Types.ObjectId;
// const coinStatusSchema = new Schema({
//   coinId: { type: ObjectId, ref: "Coin", required: true },
//   record: [
//     {
//       holder: { type: ObjectId, ref: "User", required: true },
//       holdingStatus: { type: Number, required: true },
//       time: { type: Date, default: Date.now },
//       amount: { type: Number, default: 0 },
//       price: { type: Number, required: true },
//       tx: { type: String, required: true },
//     },
//   ],
// });
// const CoinStatus = mongoose.model("CoinStatus", coinStatusSchema);
// export default CoinStatus;
