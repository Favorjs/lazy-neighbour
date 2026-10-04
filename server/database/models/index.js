import { defineModel, Fields } from "@anclatechs/sql-buns-migrate";

const Users = defineModel("users", {
    id:                 { type: Fields.UUIDField, primaryKey: true, default: "gen_random_uuid()" },
    email:              { type: Fields.TextField },
    password:           { type: Fields.TextField },
    name:               { type: Fields.TextField },
    phone:              { type: Fields.TextField, nullable: true },
    avatar_url:         { type: Fields.TextField, nullable: true },
    rating_score:       { type: Fields.DecimalField, precision: 3, scale: 2, default: "5.00" },
    karma_points:       { type: Fields.IntegerField, default: "0" },
    total_earnings:     { type: Fields.DecimalField, precision: 10, scale: 2, default: "0" },
    total_spent:        { type: Fields.DecimalField, precision: 10, scale: 2, default: "0" },
    current_role:       { type: Fields.EnumField, choices: ["LAZY", "RUNNER"], default: "LAZY" },
    stripe_account_id:  { type: Fields.TextField, nullable: true },
    stripe_customer_id: { type: Fields.TextField, nullable: true },
    is_verified:        { type: Fields.BooleanField, default: "false" },
    push_token:         { type: Fields.TextField, nullable: true },
    created_at:         { type: Fields.DateTimeField, default: "CURRENT_TIMESTAMP" },
    updated_at:         { type: Fields.DateTimeField, default: "CURRENT_TIMESTAMP" },
}, {
    relations: {
        errands_requested: { type: "hasMany", model: "errands", foreignKey: "requester_id" },
        errands_run:       { type: "hasMany", model: "errands", foreignKey: "runner_id" },
        messages:          { type: "hasMany", model: "messages", foreignKey: "sender_id" },
        ratings_given:     { type: "hasMany", model: "ratings", foreignKey: "rater_id" },
        ratings_received:  { type: "hasMany", model: "ratings", foreignKey: "rated_id" },
    },
    meta: { tableName: "users" },
});

const Errands = defineModel("errands", {
    id:              { type: Fields.UUIDField, primaryKey: true, default: "gen_random_uuid()" },
    title:           { type: Fields.TextField },
    description:     { type: Fields.TextField },
    category:        { type: Fields.EnumField, choices: ["FOOD", "STORE", "HOME", "QUICK"] },
    bounty_amount:   { type: Fields.DecimalField, precision: 10, scale: 2 },
    service_fee:     { type: Fields.DecimalField, precision: 10, scale: 2, default: "0" },
    status:          { type: Fields.EnumField, choices: ["PENDING", "ACTIVE", "COMPLETED", "RELEASED", "DISPUTED", "CANCELLED"], default: "PENDING" },
    location_lat:    { type: Fields.DecimalField, precision: 10, scale: 7 },
    location_lng:    { type: Fields.DecimalField, precision: 10, scale: 7 },
    address:         { type: Fields.TextField, nullable: true },
    proof_photo_url: { type: Fields.TextField, nullable: true },
    requester_id:    { type: Fields.UUIDField },
    runner_id:       { type: Fields.UUIDField, nullable: true },
    accepted_at:     { type: Fields.DateTimeField, nullable: true },
    completed_at:    { type: Fields.DateTimeField, nullable: true },
    released_at:     { type: Fields.DateTimeField, nullable: true },
    created_at:      { type: Fields.DateTimeField, default: "CURRENT_TIMESTAMP" },
    updated_at:      { type: Fields.DateTimeField, default: "CURRENT_TIMESTAMP" },
}, {
    relations: {
        requester:    { type: "belongsTo", model: "users", foreignKey: "requester_id" },
        runner:       { type: "belongsTo", model: "users", foreignKey: "runner_id" },
        transaction:  { type: "hasOne",    model: "transactions", foreignKey: "errand_id" },
        messages:     { type: "hasMany",   model: "messages", foreignKey: "errand_id" },
        ratings:      { type: "hasMany",   model: "ratings", foreignKey: "errand_id" },
    },
    meta: { tableName: "errands" },
});

const Transactions = defineModel("transactions", {
    id:                    { type: Fields.UUIDField, primaryKey: true, default: "gen_random_uuid()" },
    errand_id:             { type: Fields.UUIDField },
    stripe_payment_intent: { type: Fields.TextField, nullable: true },
    stripe_transfer_id:    { type: Fields.TextField, nullable: true },
    amount:                { type: Fields.DecimalField, precision: 10, scale: 2 },
    service_fee:           { type: Fields.DecimalField, precision: 10, scale: 2, default: "0" },
    runner_payout:         { type: Fields.DecimalField, precision: 10, scale: 2, default: "0" },
    status:                { type: Fields.TextField, default: "PENDING" },
    created_at:            { type: Fields.DateTimeField, default: "CURRENT_TIMESTAMP" },
    updated_at:            { type: Fields.DateTimeField, default: "CURRENT_TIMESTAMP" },
}, {
    relations: {
        errand: { type: "belongsTo", model: "errands", foreignKey: "errand_id" },
    },
    meta: { tableName: "transactions" },
});

const Messages = defineModel("messages", {
    id:         { type: Fields.UUIDField, primaryKey: true, default: "gen_random_uuid()" },
    errand_id:  { type: Fields.UUIDField },
    sender_id:  { type: Fields.UUIDField },
    content:    { type: Fields.TextField },
    is_read:    { type: Fields.BooleanField, default: "false" },
    created_at: { type: Fields.DateTimeField, default: "CURRENT_TIMESTAMP" },
}, {
    relations: {
        errand: { type: "belongsTo", model: "errands", foreignKey: "errand_id" },
        sender: { type: "belongsTo", model: "users",   foreignKey: "sender_id" },
    },
    meta: { tableName: "messages" },
});

const Ratings = defineModel("ratings", {
    id:         { type: Fields.UUIDField, primaryKey: true, default: "gen_random_uuid()" },
    errand_id:  { type: Fields.UUIDField },
    rater_id:   { type: Fields.UUIDField },
    rated_id:   { type: Fields.UUIDField },
    score:      { type: Fields.IntegerField },
    comment:    { type: Fields.TextField, nullable: true },
    created_at: { type: Fields.DateTimeField, default: "CURRENT_TIMESTAMP" },
}, {
    relations: {
        errand: { type: "belongsTo", model: "errands", foreignKey: "errand_id" },
        rater:  { type: "belongsTo", model: "users",   foreignKey: "rater_id" },
        rated:  { type: "belongsTo", model: "users",   foreignKey: "rated_id" },
    },
    meta: { tableName: "ratings" },
});

module.exports = { Users, Errands, Transactions, Messages, Ratings };
