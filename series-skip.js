(function () {
	"use strict";

	const GITHUB_DB_URL = "https://raw.githubusercontent.com/ipavlin98/lmp-series-skip-db/refs/heads/main/database/";

	function hasExistingSegments(obj) {
		return obj && obj.segments && obj.segments.skip && obj.segments.skip.length > 0;
	}

	function updatePlaylist(playlist, currentSeason, currentEpisode, segments) {
		if (playlist && Array.isArray(playlist)) {
			playlist.forEach((item, index) => {
				const itemSeason = item.season || item.s || currentSeason;
				const itemEpisode = item.episode || item.e || item.episode_number || index + 1;

				if (parseInt(itemEpisode) === parseInt(currentEpisode) && parseInt(itemSeason) === parseInt(currentSeason)) {
					if (!hasExistingSegments(item)) {
						item.segments = item.segments || {};
						item.segments.skip = segments.slice();
					}
				}
			});
		}
	}

	function getSegmentsFromDb(dbData, season, episode) {
		if (!dbData) return null;
		const seasonStr = String(season);
		const episodeStr = String(episode);

		if (dbData[seasonStr] && dbData[seasonStr][episodeStr]) {
			return dbData[seasonStr][episodeStr];
		}

		if (seasonStr === "1" && episodeStr === "1" && dbData.movie) {
			return dbData.movie;
		}

		if (dbData.movie) {
			return dbData.movie;
		}

		return null;
	}

	async function fetchFromGitHub(kpId) {
		try {
			const url = `${GITHUB_DB_URL}${kpId}.json`;
			const response = await fetch(url);
			return response.ok ? await response.json() : null;
		} catch (e) {
			return null;
		}
	}

	async function searchAndApply(videoParams) {
		let card = videoParams.movie || videoParams.card;
		if (!card) {
			const active = Lampa.Activity.active();
			if (active) card = active.movie || active.card;
		}
		if (!card) return;

		const kpId = card.kinopoisk_id || (card.source === "kinopoisk" ? card.id : null) || card.kp_id;

		const position = (function (params, defaultSeason = 1) {
			if (params.episode || params.e || params.episode_number) {
				return {
					season: parseInt(params.season || params.s || defaultSeason),
					episode: parseInt(params.episode || params.e || params.episode_number),
				};
			}
			if (params.playlist && Array.isArray(params.playlist)) {
				const url = params.url;
				const index = params.playlist.findIndex((p) => p.url && p.url === url);
				if (index !== -1) {
					const item = params.playlist[index];
					return {
						season: parseInt(item.season || item.s || defaultSeason),
						episode: index + 1,
					};
				}
			}
			return { season: defaultSeason, episode: 1 };
		})(videoParams, 1);

		let episode = position.episode;
		let season = position.season;

		const isSerial = card.number_of_seasons > 0 || (card.original_name && !card.original_title);
		if (!isSerial) {
			season = 1;
			episode = 1;
		}

		if (!kpId) return;

		if (hasExistingSegments(videoParams)) return;

		const dbData = await fetchFromGitHub(kpId);
		if (!dbData) return;

		const segmentsData = getSegmentsFromDb(dbData, season, episode);
		if (segmentsData && segmentsData.length > 0) {
			videoParams.segments = videoParams.segments || {};
			videoParams.segments.skip = segmentsData.slice();

			updatePlaylist(videoParams.playlist, season, episode, segmentsData);
			Lampa.Noty.show("Таймкоды загружены: Сезон " + season + ", Серия " + episode);
		}

		if (videoParams.playlist && Array.isArray(videoParams.playlist)) {
			videoParams.playlist.forEach((item) => {
				if (hasExistingSegments(item)) return;
				
				const itemSeason = item.season || item.s || season;
				const itemEpisode = item.episode || item.e || item.episode_number;
				if (itemSeason && itemEpisode) {
					const itemSegments = getSegmentsFromDb(dbData, itemSeason, itemEpisode);
					if (itemSegments) {
						item.segments = item.segments || {};
						item.segments.skip = itemSegments.slice();
					}
				}
			});
		}
	}

	function init() {
		if (window.lampa_series_skip) return;
		window.lampa_series_skip = true;

		const originalPlay = Lampa.Player.play;
		const originalPlaylist = Lampa.Player.playlist;
		let pendingPlaylist = null;

		Lampa.Player.playlist = function (playlist) {
			pendingPlaylist = playlist;
			originalPlaylist.call(this, playlist);
		};

		Lampa.Player.play = function (videoParams) {
			const context = this;

			if (videoParams.url) {
				Lampa.PlayerPlaylist.url(videoParams.url);
			}

			if (videoParams.playlist && videoParams.playlist.length > 0) {
				Lampa.PlayerPlaylist.set(videoParams.playlist);
			}

			searchAndApply(videoParams)
				.then(() => {
					originalPlay.call(context, videoParams);

					if (pendingPlaylist) {
						Lampa.PlayerPlaylist.set(pendingPlaylist);
						pendingPlaylist = null;
					}
				})
				.catch((e) => {
					originalPlay.call(context, videoParams);
				});
		};
	}

	if (window.Lampa && window.Lampa.Player) {
		init();
	} else {
		window.document.addEventListener("app_ready", init);
	}
})();
