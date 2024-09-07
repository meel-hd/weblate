// Copyright © Michal Čihař <michal@weblate.org>
//
// SPDX-License-Identifier: GPL-3.0-or-later

$(document).ready(() => {
  searchPreview("#replace", "#id_replace_search");
  // searchPreview('#bulk-edit', '#id_bulk_q');

  /**
   * Add preview to the search input search results.
   *
   * @param {string} search_form The selector string of the parent element of the search input
   * @param {string} search_elment The selector string of the search input/textarea
   * @param {number} fetch_max The maximum number of preview results to fetch
   *
   */
  function searchPreview(searchForm, searchElment, fetchMax) {
    const $searchElment = $(searchElment);
    const $searchForm = $(searchForm);

    // Required for styles of the preview element
    $searchElment.parent().css("position", "relative");

    // Create the preview element
    const $searchPreview = $('<div id="search-preview"></div>');
    $searchElment.after($searchPreview);

    let debounceTimeout = null;

    // Update the preview while typing with a debounce of 300ms
    $searchElment.on("input", () => {
      $searchPreview.show();
      const searchQuery = $searchElment.val();

      // Clear the previous timeout to prevent the previous
      // request since the user is still typing
      clearTimeout(debounceTimeout);

      // fetch search results but not too often
      debounceTimeout = setTimeout(() => {
        if (searchQuery) {
          $.ajax({
            url: "/api/units/",
            method: "GET",
            data: { q: searchQuery, page_size: fetchMax },
            success: (response) => {
              // Clear previous search results
              $searchPreview.html("");

              // Display the search results
              const results = response.results;
              console.log("First result: ", results[0]);
              results.forEach((result) => {
                const context = result.context;
                const source = result.source;
                const target = result.target;
                // Remove the protocol and domain from the URL
                // to make it a relative URL
                const url = result.web_url.replace(/^(?:\/\/|[^/]+)*\//, "/");
                const resultHtml = `
                                <a href="${url}" target="_blank" id="search-result" rel="noopener noreferrer">
                                  <h4>${context}</h4>
                                  <div>
                                    ${source}
                                    <span>
                                      ${target}
                                    </span>
                                  </div>
                                </a>
                            `;
                $searchPreview.append(resultHtml);
              });
            },
            error: (error) => {
              console.log("Error fetching search results: ", error);
            },
          });
        }
      }, 300); // If the user stops typing for 300ms, the search results will be fetched
    });

    // Show the preview on focus
    $searchElment.on("focus", () => {
      if ($searchElment.val() !== "" && $searchPreview.html() !== "") {
        $searchPreview.show();
      }
    });

    // Close the preview on focusout, form submit, form reset, and form clear
    $searchElment.on("focusout", () => {
      // Hide after a delay to allow click on a result
      setTimeout(() => {
        $searchPreview.hide();
      }, 700);
    });
    $searchForm.on("submit", () => {
      $searchPreview.html("");
      $searchPreview.hide();
    });
    $searchForm.on("reset", () => {
      $searchPreview.html("");
      $searchPreview.hide();
    });
    $searchForm.on("clear", () => {
      $searchPreview.html("");
      $searchPreview.hide();
    });
  }
});
