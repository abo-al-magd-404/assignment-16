"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionTypeEnum = exports.availabilityEnum = void 0;
var availabilityEnum;
(function (availabilityEnum) {
    availabilityEnum[availabilityEnum["PUBLIC"] = 0] = "PUBLIC";
    availabilityEnum[availabilityEnum["FRIENDS"] = 1] = "FRIENDS";
    availabilityEnum[availabilityEnum["ONLY_ME"] = 2] = "ONLY_ME";
})(availabilityEnum || (exports.availabilityEnum = availabilityEnum = {}));
var ReactionTypeEnum;
(function (ReactionTypeEnum) {
    ReactionTypeEnum[ReactionTypeEnum["DISLIKE"] = 0] = "DISLIKE";
    ReactionTypeEnum[ReactionTypeEnum["LIKE"] = 1] = "LIKE";
    ReactionTypeEnum[ReactionTypeEnum["LOVE"] = 2] = "LOVE";
    ReactionTypeEnum[ReactionTypeEnum["FUNNY"] = 3] = "FUNNY";
    ReactionTypeEnum[ReactionTypeEnum["SAD"] = 4] = "SAD";
    ReactionTypeEnum[ReactionTypeEnum["ANGRY"] = 5] = "ANGRY";
})(ReactionTypeEnum || (exports.ReactionTypeEnum = ReactionTypeEnum = {}));
