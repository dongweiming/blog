var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

this.LunrSearch = (function() {
  var debounce;

  function LunrSearch(elem, options) {
    this.bindKeypress = __bind(this.bindKeypress, this);
    this.displayResults = __bind(this.displayResults, this);
    this.search = __bind(this.search, this);
    this.populateSearchFromQuery = __bind(this.populateSearchFromQuery, this);
    this.compileTemplate = __bind(this.compileTemplate, this);
    this.createIndex = __bind(this.createIndex, this);
    this.$elem = elem;
    this.$results = $(options.results);
    this.$entries = $(options.entries, this.$results);
    this.indexDataUrl = options.indexUrl;
    this.index = this.createIndex();
    this.template = this.compileTemplate($(options.template));
    this.init();
  }

  LunrSearch.prototype.init = function() {
    return this.loadIndex((function(_this) {
      return function(data) {
        _this.populateIndex(data);
        _this.populateSearchFromQuery();
        return _this.bindKeypress();
      };
    })(this));
  };

  LunrSearch.prototype.createIndex = function() {
    return lunr(function() {
      this.field("title", {
        boost: 10
      });
      this.field("body");
      return this.ref("id");
    });
  };

  LunrSearch.prototype.compileTemplate = function(template) {
    return Handlebars.compile($(template).text());
  };

  LunrSearch.prototype.loadIndex = function(callback) {
    return $.getJSON(this.indexDataUrl, callback);
  };

  LunrSearch.prototype.populateIndex = function(data) {
    var entry, index, _i, _len, _ref, _results;
    index = this.index;
    this.entries = data.map(function(raw) {
      return {
        id: raw.id + 1,
        title: raw.title,
        url: raw.url,
        body: raw.content,
        date: raw.date ? "" + raw.date.month + "/" + raw.date.day + "/" + raw.date.year : void 0,
        tags: raw.tags ? raw.tags.join(",") : void 0,
        category: raw.category
      };
    });
    _ref = this.entries;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entry = _ref[_i];
      _results.push(index.add(entry));
    }
    return _results;
  };

  LunrSearch.prototype.populateSearchFromQuery = function() {
    var queryString, uri;
    uri = new URI(window.location.search.toString());
    queryString = uri.search(true);
    if (queryString.hasOwnProperty("q")) {
      $(this.$elem).val(queryString.q);
      return this.search(queryString.q.toString());
    }
  };

  LunrSearch.prototype.search = function(query) {
    var entries, results;
    entries = this.entries;
    if (query.length <= 2) {
      this.$results.hide();
      this.$entries.empty();
    } else {
      results = $.map(this.index.search(query), (function(_this) {
        return function(result) {
          var reference;
          reference = parseInt(result.ref, 10);
          return $.grep(entries, function(entry) {
            return entry.id === parseInt(result.ref, 10);
          })[0];
        };
      })(this));
    }
    if (results) {
      return this.displayResults(results);
    }
  };

  LunrSearch.prototype.displayResults = function(entries) {
    var $entries, $results;
    $entries = this.$entries;
    $results = this.$results;
    $entries.empty();
    if (entries.length === 0) {
      $entries.append("<p>Nothing found.</p>");
    } else {
      $entries.append(this.template({
        entries: entries
      }));
    }
    return $results.show();
  };

  LunrSearch.prototype.bindKeypress = function() {
    var input;
    input = $(this.$elem);
    return input.bind("keyup", debounce((function(_this) {
      return function() {
        return _this.search(input.val());
      };
    })(this)));
  };

  debounce = function(fn) {
    var slice, timeout;
    timeout = void 0;
    slice = Array.prototype.slice;
    return (function(_this) {
      return function() {
        var args, ctx;
        args = slice.call(arguments);
        ctx = _this;
        clearTimeout(timeout);
        return timeout = setTimeout(function() {
          return fn.apply(ctx, args);
        }, 100);
      };
    })(this);
  };

  return LunrSearch;

})();
