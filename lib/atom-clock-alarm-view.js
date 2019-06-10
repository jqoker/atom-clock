'use babel';

import { CompositeDisposable } from 'atom'

export default class AtomClockAlarmView {

  constructor(statusBar) {
    this.statusBar = statusBar
    this.subscriptions = new CompositeDisposable()
    this.elapsed = 0
  }

  start() {
    this.drawElement()
    this.initialize()
  }

  initialize() {
    this.setConfigValues()
    this.setTooltip(this.showTooltip)
    this.setIcon(this.showIcon)
    this.setUTCClass(this.showUTC)
    this.startTicker()

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-clock-alarm:toggle': () => this.toggle(),
      'atom-clock-alarm:utc-mode': () => atom.config.set('atom-clock-alarm.showUTC', !this.showUTC)
    }))

    this.subscriptions.add(atom.config.onDidChange('atom-clock-alarm.dateFormat', () => {
      this.refreshTicker()
    }))

    this.subscriptions.add(atom.config.onDidChange('atom-clock-alarm.showTooltip', () => {
      this.setConfigValues()
      this.setTooltip(this.showTooltip)
    }))

    this.subscriptions.add(atom.config.onDidChange('atom-clock-alarm.tooltipDateFormat', () => {
      this.refreshTicker()
    }))

    this.subscriptions.add(atom.config.onDidChange('atom-clock-alarm.locale', () => {
      this.refreshTicker()
    }))

    this.subscriptions.add(atom.config.onDidChange('atom-clock-alarm.showUTC', () => {
      this.refreshTicker()
      this.setUTCClass(this.showUTC)
    }))

    this.subscriptions.add(atom.config.onDidChange('atom-clock-alarm.refreshInterval', () => {
      this.refreshTicker()
    }))

    this.subscriptions.add(atom.config.onDidChange('atom-clock-alarm.showClockIcon', () => {
      this.setConfigValues()
      this.setIcon(this.showIcon)
    }))

    this.subscriptions.add(atom.config.onDidChange('atom-clock-alarm.alarmDuration', () => {
      this.refreshTicker()
    }))

  }

  drawElement() {
    this.element = document.createElement('div')
    this.element.classList.add('atom-clock-alarm', 'inline-block')

    this.iconElement = document.createElement('span')
    this.iconElement.classList.add('atom-clock-alarm-icon')

    this.timeElement = document.createElement('span')
    this.timeElement.classList.add('atom-clock-alarm-time')

    this.element.appendChild(this.iconElement)
    this.element.appendChild(this.timeElement)

    this.statusBar.addRightTile({
      item: this.element,
      priority: -500
    })
  }

  setConfigValues() {
    this.dateFormat = atom.config.get('atom-clock-alarm.dateFormat')
    this.showTooltip = atom.config.get('atom-clock-alarm.showTooltip')
    this.tooltipDateFormat = atom.config.get('atom-clock-alarm.tooltipDateFormat')
    this.locale = atom.config.get('atom-clock-alarm.locale')
    this.showUTC = atom.config.get('atom-clock-alarm.showUTC')
    this.refreshInterval = atom.config.get('atom-clock-alarm.refreshInterval') * 1000
    this.showIcon = atom.config.get('atom-clock-alarm.showClockIcon')
    this.alarmDuration = atom.config.get('atom-clock-alarm.alarmDuration') || 40
  }

  startTicker() {
    this.setDate()
    var nextTick = this.refreshInterval - (Date.now() % this.refreshInterval)
    this.tick = setTimeout (() =>  { this.startTicker() }, nextTick)
  }

  clearTicker() {
    if (this.tick)
      clearTimeout(this.tick)
  }

  refreshTicker() {
    this.setConfigValues()
    this.clearTicker()
    this.startTicker()
  }

  setDate() {
    this.date = this.getDate(this.locale, this.dateFormat)
    this.timeElement.textContent = this.date
    this.elapsed += this.refreshInterval // ms

    if (this.elapsed >= this.alarmDuration * 60 * 1000) {
      this.elapsed = 0
      this.clearTicker()
      this.drawTakeABreakTips()
    }
  }

  drawTakeABreakTips() {
    if (document.getElementById('break')) {
      return
    }
    var self = this
    var element = document.createElement('div')
    element.id = 'break'
    element.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
    element.style.position = 'fixed'
    element.style.left = 0
    element.style.top = 0
    element.style.right = 0
    element.style.bottom = 0
    element.style.zIndex = 100
    element.addEventListener('click', function() {
      self.startTicker()
      document.body.removeChild(this)
    })

    var content = document.createElement('div')
    content.id = 'break-content'
    content.style.position = 'absolute'
    content.style.left = '50%'
    content.style.top = '50%'
    content.style.transform = 'translate3d(-50%, -50%, 0)'
    content.innerText = 'Take a break.'
    content.style.color = '#FFFFFF'
    content.style.fontSize = '64px'

    element.appendChild(content)
    document.body.appendChild(element)
  }

  getDate(locale, format) {
    if (!this.Moment)
      this.Moment = require('moment')

    var moment= this.Moment().locale(locale)

    if (this.showUTC)
      moment.utc()

    return moment.format(format)
  }

  setIcon(toSet) {
    if (toSet)
      this.iconElement.classList.add('icon', 'icon-clock')
    else
      this.iconElement.classList.remove('icon', 'icon-clock')
  }

  setTooltip(toSet) {
    if (this.tooltip === undefined)
      this.tooltip = atom.tooltips.add(this.element, {
        title: () => this.getDate(this.locale, this.tooltipDateFormat),
        class: 'atom-clock-alarm-tooltip'
      })

    if (toSet)
      atom.tooltips.findTooltips(this.element)[0].enable()
    else
      atom.tooltips.findTooltips(this.element)[0].disable()
  }

  setUTCClass(toSet) {
    if (toSet) {
      this.element.classList.add('atom-clock-alarm-utc')
      atom.tooltips.findTooltips(this.element)[0].getTooltipElement().classList.add('atom-clock-alarm-utc')
    } else {
      this.element.classList.remove('atom-clock-alarm-utc')
      atom.tooltips.findTooltips(this.element)[0].getTooltipElement().classList.remove('atom-clock-alarm-alarm-utc')
    }
  }


  toggle() {
    var style = this.element.style.display
    this.element.style.display = style === 'none' ? '' : 'none'
  }

  destroy() {
    this.clearTicker()
    this.subscriptions.dispose()
    this.tooltip.dispose()
    this.element.remove()
  }
}
