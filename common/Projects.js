/**
 * Created by xgharibyan on 6/27/17.
 */

const Project = require('../models/project');
const _ = require('lodash');


function count(user){
    let query = {
        $match: {
            owner: user.username
        }
    };
    let option = {
        $group: {
            _id: {$gt: ["$publishDate", null]},
            count: {$sum: 1}
        }
    };
    return Project.aggregate(query, option)
        .then(projects => {
            const projectsCount = {};
            _.each(projects, (project) => {
                if (!project._id)
                    projectsCount.unpublished = project.count;
                else
                    projectsCount.published = project.count;
            });
            projectsCount.total = ((projectsCount.unpublished || 0) + (projectsCount.published || 0));
            return projectsCount;
        })
        .catch((e) => e)
}

module.exports = {
   count:count
}