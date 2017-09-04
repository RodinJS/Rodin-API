const _ = require('lodash');
const config = require('../../config/env');
const redis = require('../../common/redis');
const utils = require('../../common/utils');
const Response = require('../../common/servicesResponses');
const Project = require('../../models/project');


const subDomainName = [
	'api',
	'deck',
	'dev',
	'editor',
	'git',
	'modules',
	'stage',
	'uxt',
	'uxter',
	'store',
	'shop',
	'home',
	'error',
	'errors',
	'ab',
	'bdsm',
	'support',
	'help',
	'apps',
	'cdn',
	'hub',
	'gago',
	'jenkins',
	'qa',
	'test',
	'ci',
	'cd',
	'deploy',
	'docker',
	'cluster',
	'workers',
	'go',
	'worker',
	'ams',
	'nyc',
	'app',
	'ws',
	'wss',
	'ss',
	'docs',
	'doc',
	'tutorial',
	'guide',
	'blog',
	'mail',
	'qr',
];

const domainName = ['io', 'space', 'design'];

const disabledDomains = _.reduce(domainName, (acc, domain, key) => {
	_.each(subDomainName, (subDomain, k) => {
		if (!acc[`${subDomain}.rodin.${domain}`]) acc.push(`${subDomain}.rodin.${domain}`);
	});
	if (!acc[`rodin.${domain}`]) acc.push(`rodin.${domain}`);
	return acc;
}, []);

function _checkIfDomainExistsRedis(domain) {
	return new Promise((resolve, reject) => {
		redis.get(domain)
			.then(replay => resolve((replay) ? replay : false))
			.catch(e => { console.log(e); return reject(Response.onError(e, `Can't check domain/subdomain availability status.`, 400)); });
	})
}

function add(req) {
	return new Promise((resolve, reject) => {

		let id_raw = req.body.id || req.params.id || req.query.id;
		let domain_raw = req.body.domain || req.params.domain || req.query.domain;

		if (_.isUndefined(id_raw)) {
			return reject(Response.onError(null, `Project id does not provided!`, 400));
		}

		if (_.isUndefined(domain_raw)) {
			return reject(Response.onError(null, `Domain/Subdomain name does not provided!`, 400));
		}

		const domain = utils.cleanUrl(domain_raw.replace(/^www./, ''));
		const username = req.user.username;
		const id = utils.cleanUrl(id_raw);

		if (_.indexOf(disabledDomains, domain) >= 0) {
			return reject(Response.onError(null, `Domain/Subdomain is reserved!`, 400));
		}

		_checkIfDomainExistsRedis(domain)
			.then(replay => {
				let static_path = '';
				Project.getOne(id, username)
					.then(project => {
						static_path = `${username}/${project.root}`;

						if (!project) return reject(Response.onError(null, `Project is empty`, 404));

						if(replay) {
							if(replay !== static_path) {
								return reject(Response.onError(null, `Domain/Subdomain is reserved!`, 400));
							} else {
								return reject(Response.onError(null, `The specified domain/subdomain is active!`, 400))
							}
						}
						
						if (project.domain) {
							redis.remove(project.domain)
								.then(deleted => { 
									if(deleted) {
										return Project.findOneAndUpdateAsync({_id: id, owner: username}, {$set: {domain: domain}}, {new: true});
									} else {
										return reject({message: `Error during ${domain} domain/subdomain update!`}) 
									}
								})
								.catch(e => reject(Response.onError(e, `Can't update custom domain/subdomain!`, 400)));
						} else {
							return Project.findOneAndUpdateAsync({_id: id, owner: username}, {$set: {domain: domain}}, {new: true});
						}
					})
					.then(projData => redis.set(domain, static_path))
					.then(created => ((created) ? resolve({message: `${domain} domain/subdomain name added to project successfuly!`}) : reject({message: `Error during ${domain} domain addition.`})))
					.catch(e => {console.log(e); return reject(Response.onError(null, `Can't check Domain/Subdomain status! Please contact to support@rodin.io!`, 400)); });
			})
			.catch(e => {console.log(e); return reject(Response.onError(null, `Can't check Domain/Subdomain status! Please contact to support@rodin.io`, 400)); });
	})
}

function remove(req) {
	return new Promise((resolve, reject) => {

		let id_raw = req.body.id || req.params.id || req.query.id;
		let domain_raw = req.body.domain || req.params.domain || req.query.domain;

		if (_.isUndefined(id_raw)) {
			return reject(Response.onError(null, `Project id does not provided!`, 400));
		}

		if (_.isUndefined(domain_raw)) {
			return reject(Response.onError(null, `Domain/Subdomain name does not provided!`, 400));
		}

		const domain = utils.cleanUrl(domain_raw.replace(/^www./, ''));

		if (_.indexOf(disabledDomains, domain) >= 0) {
			return reject(Response.onError(null, `Wrong Domain/Subdomain!---`, 400));
		}

		const username = req.user.username;
		const id = utils.cleanUrl(id_raw);

		Project.getOne(id, username)
			.then((project) => {
				if (!project) return reject(Response.onError(null, `Project is empty`, 404));

				_checkIfDomainExistsRedis(domain)
					.then(replay => {
						if (!replay) {
							return reject(Response.onError(null, `Wrong Domain/Subdomain!++`, 400));
						} else {
							if(replay == `${username}/${project.root}`) {
								redis.remove(domain)
									.then(deleted => { return ((deleted) ? resolve({message: `${domain} domain/subdomain name unlinked successfully!`}) : reject({message: `Error during ${domain} domain deletion.`})) })
									.catch((e) => reject(Response.onError(e, `Can't update custom domain/subdomain.`, 400)));
							} else {
								return reject(Response.onError(null, `Wrong Domain/Subdomain!++___`, 400));
							}
						}
					})
					.catch(e => { return reject(Response.onError(null, `Wrong Domain/Subdomain!-----`, 400)); });
			})
			.catch((e) => reject(Response.onError(e, `Project not found`, 404)));
	})
}

module.exports = {
	add,
	remove,
};
