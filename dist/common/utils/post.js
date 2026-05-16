"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = void 0;
const enums_1 = require("../enums");
const getAvailability = (user) => {
    return [
        { availability: enums_1.availabilityEnum.PUBLIC },
        { availability: enums_1.availabilityEnum.ONLY_ME, createdBy: user._id },
        {
            availability: enums_1.availabilityEnum.FRIENDS,
            createdBy: { $in: [user._id, ...(user.friends || [])] },
        },
        { tags: { $in: [user._id] } },
    ];
};
exports.getAvailability = getAvailability;
