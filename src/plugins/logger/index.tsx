import Icon from 'components/Icon';
import defaultConfig from 'editor/defaultConfig';
import { PluginComponent } from 'plugins/Plugin';
import * as React from 'react';
import { KeyboardEventListener } from 'share/var';
import LoggerPlugin from './logger';

export default class Logger extends PluginComponent {
  name = 'logger';

  private logger: LoggerPlugin;
  private timerId?: number;
  private handleKeyboards: KeyboardEventListener[] = [];
  private lastPop: string | null = null;

  constructor(props: any) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleRedo = this.handleRedo.bind(this);
    this.handleUndo = this.handleUndo.bind(this);
    // Mac的Redo比较特殊，是Command+Shift+Z，优先处理
    this.handleKeyboards = [
      { key: 'y', keyCode: 89, withKey: ['ctrlKey'], callback: this.handleRedo },
      { key: 'z', keyCode: 90, withKey: ['metaKey', 'shiftKey'], callback: this.handleRedo },
      { key: 'z', keyCode: 90, withKey: ['ctrlKey'], callback: this.handleUndo },
      { key: 'z', keyCode: 90, withKey: ['metaKey'], callback: this.handleUndo },
    ];

    this.logger = new LoggerPlugin();
  }

  private handleUndo() {
    this.logger.undo(last => {
      this.pause();
      this.lastPop = last;
      this.editor.setText(last);
      this.forceUpdate();
    });
  }

  private handleRedo() {
    this.logger.redo(last => {
      this.lastPop = last;
      this.editor.setText(last);
      this.forceUpdate();
    });
  }

  handleChange(value: string) {
    if (this.logger.getLast() === value || (this.lastPop && this.lastPop === value)) {
      return;
    }
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = 0;
    }
    const interval = this.editorConfig.logger ? this.editorConfig.logger.interval : defaultConfig.logger.interval;
    this.timerId = window.setTimeout(() => {
      if (this.logger.getLast() !== value) {
        this.logger.push(value);
        this.lastPop = null;
        this.forceUpdate();
      }
      window.clearTimeout(this.timerId);
      this.timerId = 0;
    }, interval);
  }

  componentDidMount() {
    // 监听变化事件
    this.editor.onChange(this.handleChange);
    // 监听键盘事件
    this.handleKeyboards.forEach(it => this.editor.onKeyboard(it));
  }

  componentWillUnmount() {
    this.editor.offChange(this.handleChange);
    this.handleKeyboards.forEach(it => this.editor.offKeyboard(it));
  }

  pause() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  render() {
    return (
      <React.Fragment>
        <span
          className={`button button-type-undo ${this.logger.hasUndo() ? '' : 'disabled'}`}
          title="Undo"
          onClick={this.handleUndo}
        >
          <Icon type="icon-reply" />
        </span>
        <span
          className={`button button-type-redo ${this.logger.hasRedo() ? '' : 'disabled'}`}
          title="Redo"
          onClick={this.handleRedo}
        >
          <Icon type="icon-share" />
        </span>
      </React.Fragment>
    );
  }
}