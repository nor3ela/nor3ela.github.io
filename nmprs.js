(function () {

    // Polyfills
    if (!Object.keys) { Object.keys = function getObjectKeys(o) { var r = [], k; for (k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) { r.push(k); } } return r; }; }
    if (!Array.prototype.map) { Array.prototype.map = function mapArray(c, t) { if (this == null) { throw new TypeError('Array is null or undefined'); } var s = Object(this), l = s.length >>> 0; if (typeof c !== 'function') { throw new TypeError(c + ' is not a function'); } var r = new Array(l); for (var i = 0; i < l; i++) { if (i in s) { r[i] = c.call(t, s[i], i, s); } } return r; }; }
    if (!Array.prototype.forEach) { Array.prototype.forEach = function forEachArray(c, t) { if (this == null) { throw new TypeError('Array is null or undefined'); } var s = Object(this), l = s.length >>> 0; if (typeof c !== 'function') { throw new TypeError(c + ' is not a function'); } for (var i = 0; i < l; i++) { if (i in s) { c.call(t, s[i], i, s); } } }; }
    if (!Array.prototype.indexOf) { Array.prototype.indexOf = function indexOfElement(e, f) { if (this == null) { throw new TypeError('"this" is null or not defined'); } var s = Object(this), l = s.length >>> 0; if (l === 0) return -1; var i = Number(f) || 0; if (i >= l) return -1; var k = Math.max(i >= 0 ? i : l - Math.abs(i), 0); while (k < l) { if (k in s && s[k] === e) return k; k++; } return -1; }; }

    var DEFAULT_SOURCE_NAME = 'NUMParser';
    var SOURCE_NAME = Lampa.Storage.get('numparser_source_name', DEFAULT_SOURCE_NAME);
    var BASE_URL = 'https://num.jac-red.ru';
    var ICON = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"><g><g><path fill="currentColor" d="M482.909,67.2H29.091C13.05,67.2,0,80.25,0,96.291v319.418C0,431.75,13.05,444.8,29.091,444.8h453.818c16.041,0,29.091-13.05,29.091-29.091V96.291C512,80.25,498.95,67.2,482.909,67.2z M477.091,409.891H34.909V102.109h442.182V409.891z"/></g></g><g><g><rect fill="currentColor" x="126.836" y="84.655" width="34.909" height="342.109"/></g></g><g><g><rect fill="currentColor" x="350.255" y="84.655" width="34.909" height="342.109"/></g></g><g><g><rect fill="currentColor" x="367.709" y="184.145" width="126.836" height="34.909"/></g></g><g><g><rect fill="currentColor" x="17.455" y="184.145" width="126.836" height="34.909"/></g></g><g><g><rect fill="currentColor" x="367.709" y="292.364" width="126.836" height="34.909"/></g></g><g><g><rect fill="currentColor" x="17.455" y="292.364" width="126.836" height="34.909"/></g></g></svg>';
    var CACHE_SIZE = 100;
    var CACHE_TIME = 1000 * 60 * 60; // 1 час
    var cache = {};

    // Настройки видимости групп годов
    var currentYear = new Date().getFullYear();

    function isYearVisible(year) {
        if (year >= 1980 && year <= 1989) return CATEGORY_VISIBILITY.year_1980_1989.visible;
        if (year >= 1990 && year <= 1999) return CATEGORY_VISIBILITY.year_1990_1999.visible;
        if (year >= 2000 && year <= 2009) return CATEGORY_VISIBILITY.year_2000_2009.visible;
        if (year >= 2010 && year <= 2019) return CATEGORY_VISIBILITY.year_2010_2019.visible;
        if (year >= 2020 && year <= currentYear) return CATEGORY_VISIBILITY.year_2020_current.visible;
        return false;
    }

    // Настройки видимости категорий
    var CATEGORY_VISIBILITY = {
        k4_new: {
            title: 'В высоком качестве новые',
            visible: Lampa.Storage.get('numparser_category_k4_new', true)
        },
        movies_new: {
            title: 'Новые фильмы',
            visible: Lampa.Storage.get('numparser_category_movies_new', true)
        },
        russian_new_movies: {
            title: 'Новые русские фильмы',
            visible: Lampa.Storage.get('numparser_category_russian_new_movies', true)
        },
        all_tv: {
            title: 'Сериалы',
            visible: Lampa.Storage.get('numparser_category_all_tv', true)
        },
        russian_tv: {
            title: 'Русские сериалы',
            visible: Lampa.Storage.get('numparser_category_russian_tv', true)
        },
        k4: {
            title: 'В высоком качестве',
            visible: Lampa.Storage.get('numparser_category_k4', true)
        },
        legends: {
            title: 'Топ фильмы',
            visible: Lampa.Storage.get('numparser_category_legends', true)
        },
        cartoons: {
            title: 'Мультфильмы',
            visible: Lampa.Storage.get('numparser_category_cartoons', true)
        },
        cartoons_tv: {
            title: 'Мультсериалы',
            visible: Lampa.Storage.get('numparser_category_cartoons_tv', true)
        },
        anime: {
            title: 'Аниме',
            visible: Lampa.Storage.get('numparser_category_anime', true)
        },
        // Группы годов
        year_1980_1989: {
            title: 'Фильмы 1980-1989',
            visible: Lampa.Storage.get('numparser_year_1980_1989', false)
        },
        year_1990_1999: {
            title: 'Фильмы 1990-1999',
            visible: Lampa.Storage.get('numparser_year_1990_1999', false)
        },
        year_2000_2009: {
            title: 'Фильмы 2000-2009',
            visible: Lampa.Storage.get('numparser_year_2000_2009', false)
        },
        year_2010_2019: {
            title: 'Фильмы 2010-2019',
            visible: Lampa.Storage.get('numparser_year_2010_2019', true)
        },
        year_2020_current: {
            title: 'Фильмы 2020-' + currentYear,
            visible: Lampa.Storage.get('numparser_year_2020_current', true)
        }
    };

    var CATEGORIES = {
        k4_new: 'lampac_movies_4k_new',
        movies_new: "lampac_movies_new",
        russian_new_movies: 'lampac_movies_ru_new',
        all_tv: 'lampac_all_tv_shows',
        russian_tv: 'lampac_all_tv_shows_ru',
        k4: 'lampac_movies_4k',
        legends: 'legends_id',
        cartoons: 'lampac_all_cartoon_movies',
        cartoons_tv: 'lampac_all_cartoon_series',
        anime: 'anime_id',
        movies: 'lampac_movies',
        russian_movies: 'lampac_movies_ru'
    };

    // Динамически добавляем категории для годов
    for (var year = 1980; year <= currentYear; year++) {
        CATEGORIES['movies_id_' + year] = 'movies_id_' + year;
    }

    function addTranslates() {
        Lampa.Lang.add({
            numparser_title: {
                en: 'Title',
                uk: 'Назва',
                ru: 'Название'
            },
            numparser_title_desc: {
                en: 'Enter a title instead of ',
                uk: 'Введіть назву замість ',
                ru: 'Введите свое название вместо '
            },
            numparser_select_visibility: {
                en: 'Select whether the category will be visible',
                uk: 'Виберіть чи буде відображатися категорія',
                ru: 'Выберите будет ли отображаться категория'
            }
        });
    }

    function NumparserApiService() {
        var self = this;
        self.network = new Lampa.Reguest();
        self.discovery = false;

        function getCache(key) {
            var res = cache[key];
            if (res) {
                var cache_timestamp = Date.now() - CACHE_TIME;
                if (res.timestamp > cache_timestamp) return res.value;

                for (var ID in cache) {
                    var node = cache[ID];
                    if (!(node && node.timestamp > cache_timestamp)) delete cache[ID];
                }
            }
            return null;
        }

        function setCache(key, value) {
            var timestamp = Date.now();
            var size = Object.keys(cache).length;

            if (size >= CACHE_SIZE) {
                var cache_timestamp = timestamp - CACHE_TIME;
                for (var ID in cache) {
                    var node = cache[ID];
                    if (!(node && node.timestamp > cache_timestamp)) delete cache[ID];
                }
            }

            cache[key] = {
                timestamp: timestamp,
                value: value
            };
        }

        function normalizeData(json) {
            return {
                results: (json.results || []).map(function (item) {
                    var dataItem = {
                        id: item.id,
                        poster_path: item.poster_path || item.poster || '',
                        img: item.img,
                        overview: item.overview || item.description || '',
                        vote_average: item.vote_average || 0,
                        backdrop_path: item.backdrop_path || item.backdrop || '',
                        background_image: item.background_image,
                        source: Lampa.Storage.get('numparser_source_name') || SOURCE_NAME
                    };

                    if (!!item.release_quality) dataItem.release_quality = item.release_quality;

                    if (!!item.name) dataItem.name = item.name;
                    if (!!item.title) dataItem.title = item.title;
                    if (!!item.original_name) dataItem.original_name = item.original_name;
                    if (!!item.original_title) dataItem.original_title = item.original_title;

                    if (!!item.release_date) dataItem.release_date = item.release_date;
                    if (!!item.first_air_date) dataItem.first_air_date = item.first_air_date;
                    if (!!item.number_of_seasons) dataItem.number_of_seasons = item.number_of_seasons;
                    if (!!item.last_air_date) dataItem.last_air_date = item.last_air_date;
                    if (!!item.last_episode_to_air) dataItem.last_episode_to_air = item.last_episode_to_air;

                    dataItem.promo_title = dataItem.name || dataItem.title || dataItem.original_name || dataItem.original_title;
                    dataItem.promo = dataItem.overview;

                    return dataItem;
                }),
                page: json.page || 1,
                total_pages: json.total_pages || json.pagesCount || 1,
                total_results: json.total_results || json.total || 0
            };
        }

        function getFromCache(url, params, onComplete, onError) {
            var json = getCache(url);
            if (json) {
                onComplete(normalizeData(json));
            } else {
                self.get(url, params, onComplete, onError);
            }
        }

        self.get = function (url, params, onComplete, onError) {
            self.network.silent(url, function (json) {
                if (!json) {
                    onError(new Error('Empty response from server'));
                    return;
                }
                var normalizedJson = normalizeData(json);
                setCache(url, normalizedJson);
                onComplete(normalizedJson);
            }, function (error) {
                onError(error);
            });
        };

        self.list = function (params, onComplete, onError) {
            params = params || {};
            onComplete = onComplete || function () { };
            onError = onError || function () { };

            var category = params.url || CATEGORIES.movies_new;
            var page = params.page || 1;
            var url = BASE_URL + '/' + category + '?page=' + page + '&language=' + Lampa.Storage.get('tmdb_lang', 'ru');

            getFromCache(url, params, function(json) {
                onComplete({
                    results: json.results || [],
                    page: json.page || page,
                    total_pages: json.total_pages || 1,
                    total_results: json.total_results || 0
                });
            }, onError);
        };

        self.full = function (params, onSuccess, onError) {
            var card = params.card;
            params.method = !!(card.number_of_seasons || card.seasons || card.first_air_date) ? 'tv' : 'movie';
            Lampa.Api.sources.tmdb.full(params, onSuccess, onError);
        }

        self.category = function (params, onSuccess, onError) {
            params = params || {};

            var partsData = [];

            // Основные категории с новым порядком
            if (CATEGORY_VISIBILITY.k4_new.visible) partsData.push(function (callback) {
                makeRequest(CATEGORIES.k4_new, CATEGORY_VISIBILITY.k4_new.title, callback);
            });
            if (CATEGORY_VISIBILITY.movies_new.visible) partsData.push(function (callback) {
                makeRequest(CATEGORIES.movies_new, CATEGORY_VISIBILITY.movies_new.title, callback);
            });
            if (CATEGORY_VISIBILITY.russian_new_movies.visible) partsData.push(function (callback) {
                makeRequest(CATEGORIES.russian_new_movies, CATEGORY_VISIBILITY.russian_new_movies.title, callback);
            });
            if (CATEGORY_VISIBILITY.all_tv.visible) partsData.push(function (callback) {
                makeRequest(CATEGORIES.all_tv, CATEGORY_VISIBILITY.all_tv.title, callback);
            });
            if (CATEGORY_VISIBILITY.russian_tv.visible) partsData.push(function (callback) {
                makeRequest(CATEGORIES.russian_tv, CATEGORY_VISIBILITY.russian_tv.title, callback);
            });
            if (CATEGORY_VISIBILITY.k4.visible) partsData.push(function (callback) {
                makeRequest(CATEGORIES.k4, CATEGORY_VISIBILITY.k4.title, callback);
            });
            if (CATEGORY_VISIBILITY.legends.visible) partsData.push(function (callback) {
                makeRequest(CATEGORIES.legends, CATEGORY_VISIBILITY.legends.title, callback);
            });
            if (CATEGORY_VISIBILITY.cartoons.visible) partsData.push(function (callback) {
                makeRequest(CATEGORIES.cartoons, CATEGORY_VISIBILITY.cartoons.title, callback);
            });
            if (CATEGORY_VISIBILITY.cartoons_tv.visible) partsData.push(function (callback) {
                makeRequest(CATEGORIES.cartoons_tv, CATEGORY_VISIBILITY.cartoons_tv.title, callback);
            });
            if (CATEGORY_VISIBILITY.anime.visible) partsData.push(function (callback) {
                makeRequest(CATEGORIES.anime, CATEGORY_VISIBILITY.anime.title, callback);
            });

            // Добавляем категории по годам в обратном порядке (от новых к старым)
            for (var year = currentYear; year >= 1980; year--) {
                if (isYearVisible(year)) {
                    (function(y) {
                        partsData.push(function(callback) {
                            makeRequest(CATEGORIES['movies_id_' + y], 'Фильмы ' + y + ' года', callback);
                        });
                    })(year);
                }
            }

            function makeRequest(category, title, callback) {
                var page = params.page || 1;
                var url = BASE_URL + '/' + category + '?page=' + page + '&language=' + Lampa.Storage.get('tmdb_lang', 'ru');

                getFromCache(url, params, function(json) {
                    var result = {
                        url: category,
                        title: title,
                        page: page,
                        total_results: json.total_results || 0,
                        total_pages: json.total_pages || 1,
                        more: json.total_pages > page,
                        results: json.results || [],
                        source: Lampa.Storage.get('numparser_source_name') || SOURCE_NAME
                    };
                    callback(result);
                }, function(error) {
                    callback({ error: error });
                });
            }

            function loadPart(partLoaded, partEmpty) {
                Lampa.Api.partNext(partsData, 5, function (result) {
                    partLoaded(result);
                }, function (error) {
                    partEmpty(error);
                });
            }

            loadPart(onSuccess, onError);
            return loadPart;
        };
    }

    function startPlugin() {
        if (window.numparser_plugin) return;
        window.numparser_plugin = true;

        addTranslates();

        newName = Lampa.Storage.get('numparser_settings', SOURCE_NAME);
        if (Lampa.Storage.field('start_page') === SOURCE_NAME) {
            window.start_deep_link = {
                component: 'category',
                page: 1,
                url: '',
                source: SOURCE_NAME,
                title: SOURCE_NAME
            };
        }

        var values = Lampa.Params.values.start_page;
        values[SOURCE_NAME] = SOURCE_NAME;

        // Добавляем раздел настроек
        Lampa.SettingsApi.addComponent({
            component: 'numparser_settings',
            name: SOURCE_NAME,
            icon: ICON
        });

        // Настройка для изменения названия источника
        Lampa.SettingsApi.addParam({
            component: 'numparser_settings',
            param: {
                name: 'numparser_source_name',
                type: 'input',
                placeholder: 'Введите название',
                values: '',
                default: DEFAULT_SOURCE_NAME
            },
            field: {
                name: 'Название источника',
                description: 'Изменение названия источника в меню'
            },
            onChange: function (value) {
                newName = value;
                $('.num_text').text(value);
                Lampa.Settings.update();
            }
        });

        Object.keys(CATEGORY_VISIBILITY).forEach(function(option) {
            var settingName = 'numparser_settings' + option + '_visible';

            var visible = Lampa.Storage.get(settingName, "true").toString() === "true";
            CATEGORY_VISIBILITY[option].visible = visible;

            Lampa.SettingsApi.addParam({
                component: "numparser_settings",
                param: {
                    name: settingName,
                    type: "trigger",
                    default: visible
                },
                field: {
                    name: CATEGORY_VISIBILITY[option].title,
                    description: Lampa.Lang.translate('numparser_select_visibility')
                },
                onChange: function(value) {
                    CATEGORY_VISIBILITY[option].visible = value === "true";
                }
            });
        });

        var numparserApi = new NumparserApiService();
        Lampa.Api.sources.numparser = numparserApi;
        Object.defineProperty(Lampa.Api.sources, SOURCE_NAME, {
            get: function () {
                return numparserApi;
            }
        });

        var menuItem = $('<li data-action="numparser" class="menu__item selector"><div class="menu__ico">' + ICON + '</div><div class="menu__text num_text">' + SOURCE_NAME + '</div></li>');
        $('.menu .menu__list').eq(0).append(menuItem);

        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                title: SOURCE_NAME,
                component: 'category',
                source: SOURCE_NAME,
                page: 1
            });
        });
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                startPlugin();
            }
        });
    }
})();