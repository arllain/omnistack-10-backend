const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('./../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('./../websocket');

module.exports = {
  async index(_, response) {
    const devs = await Dev.find();

    return response.json(devs);
  },
  async store(request, response) {
    const { github_username, techs, latitude, longitude } = request.body;

    let dev = await Dev.findOne({ github_username });

    if (!dev) {
      const resp = await axios.get(
        `https://api.github.com/users/${github_username}`
      );

      const { name = login, avatar_url, bio } = resp.data;

      const techsArray = parseStringAsArray(techs);

      const location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };

      dev = await Dev.create({
        github_username,
        name,
        avatar_url,
        bio,
        techs: techsArray,
        location,
      });

      const sendSocketMessageTo = findConnections(
        { latitude, longitude },
        techsArray
      );

      sendMessage(sendSocketMessageTo, 'new-dev', dev);
    }

    return response.json(dev);
  },

  async update(request, response) {
    const { github_username } = request.params;
    const { coords, techs } = request.body;
    const { latitude, longitude } = coords;

    const resp = await axios.get(
      `https://api.github.com/users/${github_username}`
    );

    const location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    const { name, bio, avatar_url } = resp.data;

    const dev = await Dev.findOneAndUpdate(
      { github_username },
      {
        name,
        bio,
        avatar_url,
        techs: techs.split(',').map(t => t.trim()),
        location,
      },
      {
        new: true,
      }
    );

    if (!dev) {
      return response.status(400).json({ error: "Dev don't exists yet!" });
    }

    const sendSocketMessageTo = findConnections({ latitude, longitude }, techs);

    sendMessage(sendSocketMessageTo, 'update-dev', dev);

    return response.json(dev);
  },

  async destroy(request, response) {
    const { github_username } = request.params;
    const { latitude, longitude, techs } = request.body;

    const dev = await Dev.findOne({ github_username });

    await dev.delete();

    const sendSocketMessageTo = findConnections({ latitude, longitude }, techs);

    sendMessage(sendSocketMessageTo, 'delete-dev', dev);

    console.log(sendSocketMessageTo);

    return response.json();
  },
};
