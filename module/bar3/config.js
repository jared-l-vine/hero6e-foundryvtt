export const extendTokenConfig = async function (tokenConfig, html, data) {
  data.brawlBars = api.getBars(tokenConfig.token);

  if (tokenConfig instanceof DefaultTokenConfig) {
      // Make sure that the current value exists for selection.
      const attrLists = Object.values(data.barAttributes);
      for (let bar of Object.values(data.brawlBars)) {
          if (!attrLists.some(list => list.includes(bar.attribute))) {
              attrLists[0].push(bar.attribute);
          }
      }
  }

  const barConfiguration = await renderTemplate("modules/barbrawl/templates/token-resources.hbs", data);

  const resourceTab = html.find("div[data-tab='resources']");
  resourceTab.find("div.form-fields").parent().remove();
  resourceTab.append(barConfiguration);
  if (resourceTab.hasClass("active")) adjustConfigHeight(html, data.brawlBars.length);

  resourceTab.on("change", ".brawlbar-attribute", onChangeBarAttribute.bind(tokenConfig.token));
  resourceTab.on("click", ".bar-modifiers .fa-trash", onDeleteBar);
  resourceTab.on("click", ".bar-modifiers .fa-chevron-up", onMoveBarUp);
  resourceTab.on("click", ".bar-modifiers .fa-chevron-down", onMoveBarDown);
  resourceTab.on("click", "button.file-picker", tokenConfig._activateFilePicker.bind(tokenConfig));

  resourceTab.find(".brawlbar-add").click(event => onAddResource(event, tokenConfig, data));
  resourceTab.find(".brawlbar-save").click(() => onSaveDefaults(tokenConfig));
  resourceTab.find(".brawlbar-load").click(() => onLoadDefaults(tokenConfig, data));

  // Trigger change event once to update resource values.
  resourceTab.find("select.brawlbar-attribute").each((_, el) => refreshValueInput(tokenConfig.token, el));
}
