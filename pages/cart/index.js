/* 

    一 获取用户的收获地址
        1绑定事件
        2微信api 获取收货地址 wx.chooseAddress

        //开发者工具已经修复：：不存在下列问题
        2获取用户对小程序 授权 获取地址 的状态 scope
            1假设用户 点击获取收获地址的提示框 确定
              scope 值 true 直接调用获取收获地址
            2假设用户从来没有调用过收获地址的api
              scope 值 undefined 直接调用获取收货地址
            3假设用户点击 获取收货地址的提示框 取消
              scope 值 false
                  1 诱导用户打开授权设置页面(wx.openSetting) 当用户重新授权 才能调用
                  2 获取收获地址
            4获取到的收货地址 存入本地
    二 页面加载完毕
        0 onload onShow
        1 获取本地地址
        2 把数据设置给data中变量
    三  onshow
        0 回到商品详情页面 第一次添加商品 手动添加了属性
        1onShow获取缓存的数组
        2填充到data中
    四 全选的实现
       1 onShow 获取缓存的数组
       2 计算商品是否都被选中 checked=true
    五 总价格和总数量
        1 都需要商品被选中 才计算
        2 获取购物车的数组 进行遍历 判断是否被选中
            总价格 += 商品单价 * 商品数量
            总数量 += 商品数量
            计算后的价格和数量设置回data中
    六 商品的选中功能
      1 绑定change事件
      2 获取被修改的商品对象
      3 取反商品选中状态
      4 重新填充回data中和缓存中
      5 重新计算 全选 总价格 总数量   
    七 全选 反选
      1 全选绑定事件
      2 获取data中的全选变量 allChecked
      3 直接取反
      4 遍历购物车数组 让里面的购物车商品选中状态跟随 allChecked
      5 购物车数组选中状态 和 allChecked重新设置回data中 把购物车重新设置回缓存
    八 商品数量的编辑功能
      1 + 和 - 绑定同一个点击事件，自定义属性 +：+1 ，-：-1
      2 传递被点击的商品id goods_id
      3 获取到data中的购物车数组 来获取需要被修改的商品对象
      4 直接修改商品对象的数量属性
          当 商品数量 =1 同时 用户点击-1 询问用户是否要删除 弹窗wx.showModal
            确定 或 取消
      5 把cart 数组重新设置回缓存和data中 this.setCart
    九 点击结算
      1 判断有无收货地址
      2 判断用户有无选购商品
      3 经过以上验证就跳转到支付页面

*/
import { getSetting, chooseAddress, openSetting, showModal, showToast } from "../../utils/asyncWx"
import regeneratorRuntime from '../../lib/runtime/runtime';
Page({
  data: {
    address: {},
    cart: [],
    allChecked: false,
    totalPrice: 0,
    totalNum: 0
  },
  onShow() {
    //1 获取缓存中的收货地址
    const address = wx.getStorageSync("address");
    //一 获取缓存中的购物车数据
    const cart = wx.getStorageSync("cart") || [];
    this.setData({ address })
    this.setCart(cart);
    /* //计算全选
    //every 数组方法 回遍历 回接收一个回调函数 那么每一个回调函数都返回true 那么every的返回值就是true，一个回调false 不再执行 直接返回false
    //空数组 调用every 返回值就是true
    // const allChecked=cart.length?cart.every(v=>v.checked):false;
    let allChecked = true
    //总价格 总数量
    let totalPrice = 0;
    let totalNum = 0;
    cart.forEach(v => {
      if (v.checked) {
        totalPrice += v.num * v.goods_price;
        totalNum += v.num;
      } else {
        allChecked = false
      }
    })
    //判断数组是否为空
    allChecked = cart.length != 0 ? allChecked : false
    //2 给data赋值
    this.setData({
      address,
      cart,
      allChecked,
      totalPrice,
      totalNum
    }) */

  },
  async handleChooseAddress() {
    try {
      //1获取权限状态
      const res1 = await getSetting();
      const scopeAddress = res1.authSetting["scope.address"];
      // 2判断权限状态
      if (scopeAddress === false) {
        await openSetting();
      }
      const address = await chooseAddress();
      address.all = address.provinceName + address.cityName + address.countyName + address.detailInfo;
      //存入到缓存
      wx.setStorageSync("address", address);
    } catch (error) {
      console.log(error);
    }
  },
  //商品的选中
  handleItemChange(e) {
    //1 获取被修改的商品id
    const goods_id = e.currentTarget.dataset.id;
    // console.log(goods_id);
    //2 获取购物车数组
    let { cart } = this.data;
    //3 找到被修改的商品对象
    let index = cart.findIndex(v => v.goods_id === goods_id);
    //4 选中状态取反
    cart[index].checked = !cart[index].checked;
    //
    this.setCart(cart);

  },
  //设置购物车状态同时 重新计算 底部工具栏的数据 全选 总价格 数量
  setCart(cart) {
    let allChecked = true
    //总价格 总数量
    let totalPrice = 0;
    let totalNum = 0;
    cart.forEach(v => {
      if (v.checked) {
        totalPrice += v.num * v.goods_price;
        totalNum += v.num;
      } else {
        allChecked = false
      }
    })
    //判断数组是否为空
    allChecked = cart.length != 0 ? allChecked : false
    this.setData({
      cart,
      totalPrice,
      totalNum,
      allChecked
    });
    wx.setStorageSync("cart", cart);
  },
  //商品的全选功能
  handleItemAllChecked() {
    //1 获取data中的数据
    let { cart, allChecked } = this.data;
    //2 修改值
    allChecked = !allChecked
    //3 循环修改cart数组中的商品选中状态
    cart.forEach(v => v.checked = allChecked);
    //4 把修改后的值 填充回data和缓存中
    this.setCart(cart);
  },
  //商品数量编辑
  async handleItemNumberEdit(e) {
    //获取参数
    const { operation, id } = e.currentTarget.dataset;
    // console.log(operation,id);
    // 获取购物车数字
    let { cart } = this.data;
    // 获取要修改商品的索引
    const index = cart.findIndex(v => v.goods_id === id);
    //判断是否-到0，删除
    if (cart[index].num === 1 && operation === -1) {
      //弹窗提示
      const res = await showModal({ content: "您是否要移除该商品？" });
      if (res.confirm) {
        cart.splice(index, 1);
        this.setCart(cart);
      }
    } else {
      //修改数量
      cart[index].num += operation;
      //设置回缓存和data
      this.setCart(cart);
    }
  },
  //点击结算之后
  async handlePay() {
    // 1 判断收货地址
    const { address, totalNum } = this.data;
    if (!address.userName) {
      await showToast({ title: "您还没选择收货地址" });
      return;
    }
    //判断用户有无选购商品
    if (totalNum === 0) {
      await showToast({ title: "您还没有选购商品" });
      return;
    }
    //跳转到支付页面
    wx.navigateTo({
      url: '/pages/pay/index'
    });
  }

  //点击 收货地址
  /* async handleChooseAddress() {
    // console.log("触发")
    // 获取收获地址
    /* wx.chooseAddress({
      success: (result) => {
        console.log(result)
      }
    }); */
  //获取权限状态
  /* wx.getSetting({
    success: (result) => {
      //获取权限状态 只要发现一些属性名怪异 都要使用[""]获取属性值
      // const scopeAddress = result.authSetting.scope.address
      const scopeAddress = result.authSetting["scope.address"];
      if (scopeAddress === true || scopeAddress === undefined) {
        wx.chooseAddress({
          success: (result1) => {
            console.log(result1);
          }
        });

      } else {
        //用户拒绝过权限 诱导用户打开收取页面
        wx.openSetting({
          success: (result2) => {
            //调用获取收获地址代码
            wx.chooseAddress({
              success: (result3) => {

              }
            });
          }
        });

      }
    },
    fail: () => { },
    complete: () => { }
  });
*/

  /* // 优化前
  //1获取权限状态
  const res1 = await getSetting();
  const scopeAddress = res1.authSetting["scope.address"];
  // 2判断权限状态
  if (scopeAddress === true || scopeAddress === undefined) {
    //3 调用获取收货地址的代码api
    // const res2 = await chooseAddress();
    // console.log(res2);
  } else {
    //诱导用户打开授权
    await openSetting();
    //4 调用获取收货地址的api
    //  const res2 = await chooseAddress();
    // console.log(res2); 
  }
  const res2 = await chooseAddress();
  // console.log(res2);
}, */

})