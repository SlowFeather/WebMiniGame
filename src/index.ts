import { Component, EngineA, EngineB, GameObjectA, TransformB, TransformSystem } from "./performanceTest";

// GameContainer
const GameContainer = document.getElementById('container');
const GameCanvas = document.getElementById('gameCanvas');
const GameRoot = document.getElementById('gameRoot');




// -------------------------------------
// 主测试逻辑
// -------------------------------------
async function main() {
    const NUM_OBJS   = 2000;
    const NUM_FRAMES = 1000;
  
    console.log(`对象数量：${NUM_OBJS}，模拟帧数：${NUM_FRAMES}\n`);
  
    // —— 场景 A 准备 —— 
    const engA = EngineA.instance;
    for (let i = 0; i < NUM_OBJS; i++) {
      const go = new GameObjectA(`A_${i}`);
      go.addComponent(new class extends Component {
        getTypeName() { return 'DummyA'; }
        update(dt: number) { const v = Math.sqrt(dt * i); }
      }());
      engA.addGameObject(go);
    }
    engA.initTimer();
  
    console.time('EngineA 总耗时');
    for (let f = 0; f < NUM_FRAMES; f++) {
      engA.step();
    }
    console.timeEnd('EngineA 总耗时');
  
    // —— 场景 B 准备 —— 
    const engB = EngineB.getInstance();
    engB.registerSystem('TransformB', new TransformSystem());
    for (let i = 0; i < NUM_OBJS; i++) {
      // TransformB
      const t = new TransformB();
      t.gameObject = { id: i, addComponent() { return null; } } as any;
      engB.registerComponent(t);
      // 自定义组件
      const c = new class extends Component {
        getTypeName() { return 'DummyB'; }
        update(dt: number) { const v = Math.log(dt + i); }
      }();
      c.gameObject = t.gameObject;
      // 需先创建数组槽
      if (!engB['compMap'].has(c.getTypeName())) {
        engB['compMap'].set(c.getTypeName(), []);
        engB.registerSystem(c.getTypeName(), { update(dt){ } });
      }
      engB.registerComponent(c);
    }
    engB.initTimer();
  
    console.time('EngineB 总耗时');
    for (let f = 0; f < NUM_FRAMES; f++) {
      engB.step();
    }
    console.timeEnd('EngineB 总耗时');
  }
  
  main().catch(console.error);