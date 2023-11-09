import { NgClass, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, WritableSignal, computed, signal } from '@angular/core';
import { NumpadComponent } from 'src/app/components/numpad/numpad.component';

@Component({
  standalone: true,
  imports: [NgFor, NgClass, NumpadComponent],
  selector: 'sudo-play-pad',
  templateUrl: './play-pad.component.html',
  styleUrls: ['./play-pad.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayPadComponent {
  @Output() played = new EventEmitter<string>();

  focusedPos: 0 | 1 | 2 | 3 = 0;
  accentPads = new Array(10);
  selection: WritableSignal<(number | null)[]> = signal([null, null, null, null]);
  disabledPads = computed(() => Array.from(new Array(10), (_, index) => this.selection().includes(index)));
  submitDisabled = true;

  selectNum(num: number) {
    this.selection.mutate(val => {
      delete val[val.findIndex(v => v === num)];
      val[this.focusedPos] = num;
    });
    this.focusedPos = (this.focusedPos + 1) % 4 as 0 | 1 | 2 | 3;

    const allValuesSelected = this.selection().findIndex(v => v == null) === -1;
    this.submitDisabled = !allValuesSelected;
  }

  holdNum(num: number) {
    this.accentPads[num] = !this.accentPads[num];
    this.accentPads = [...this.accentPads];
    console.log(this.accentPads);
  }

  updateFocus(index: number) {
    this.focusedPos = index as 0 | 1 | 2 | 3;
  }

  submitSelection() {
    if (!this.submitDisabled) {
      this.played.emit(this.selection().join(''));
      this.selection.set([null, null, null, null]);
    }
  }
}
