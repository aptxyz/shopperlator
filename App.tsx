import { parse } from '@babel/core';
import React, { Component } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, ScrollView, Image } from 'react-native';
import { renderNode } from 'react-native-elements/dist/helpers';

class App extends Component <any, any> {

  referenceList: any;

  constructor(props: {} | Readonly<{}>) {

    super(props);
    this.state = {
      rows: 1,
      orientation: orientation()
    }
    
    this.referenceList = [];
    this.handleSubmit = this.handleSubmit.bind(this);

    Dimensions.addEventListener('change', () => {
      this.setState({'orientation': orientation()})
    })

  }

  focusLastRowPrice() {
    // setTimeout(() => {
    //   let index = this.referenceList.length - 1;
    //   let row = this.referenceList[index];
    //   if (row) row.priceRef.focus();
    // }, 50);

  }

  async addRow() {
    await this.setState({ rows: this.state.rows + 1 });
  }

  async reset() {
    await this.setState({rows: 0})
    await this.setState({rows: 1})
  }

  handleSubmit(currentKey: number, currentItem: string) {

    let focusKey, focusRow, focusItem, isCurrentItemLastChild, isCurrentRowLastRow;

    // focus the next item 
    isCurrentItemLastChild = currentItem == 'weight'
    isCurrentRowLastRow = currentKey + 1 == this.referenceList.length;
    
    focusKey = currentKey;
    if (isCurrentItemLastChild && isCurrentRowLastRow) focusKey = 0;
    if (isCurrentItemLastChild && !isCurrentRowLastRow) focusKey = currentKey + 1;
    
    focusRow = this.referenceList[focusKey];

    switch (currentItem) {
      case 'price':     focusItem = focusRow.discountRef; break;
      case 'discount':  focusItem = focusRow.weightRef; break;
      case 'weight':    focusItem = focusRow.priceRef; break;
    }

    focusItem.focus();

    // remove trailing decimal
    let shopperlator, value;

    shopperlator = this.referenceList[currentKey];
    value = shopperlator.state[currentItem]
    value = value.replace(/\.$/,'');

    shopperlator.setState({
      [currentItem] : value
    })

  }

  render() {

    let rows = [];

    for (let i = 0; i < this.state.rows; i++) {
      rows.push(
      <Shopperlator
        key={i}
        rowIndex={i}
        ref={ref => this.referenceList[i] = ref}
        handleSubmit = {this.handleSubmit}
      />);
    }

    let responsiveScreen = this.state.orientation === 'portrait' ? styles.portrait : styles.landscape 

    return (
      <SafeAreaView style={[styles.container, responsiveScreen]}>
        <StatusBar />
        <View style={styles.titleView}>
          <Image style={styles.icon} source={require('./shopperlator.png')} />
          <Text style={styles.title}>Shopperlator</Text>
        </View>

        <ScrollView contentContainerStyle={styles.mainView}>
          {rows}
        </ScrollView>
        <View style={styles.navView}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => this.reset()}
          >
            <Text>reset</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => this.addRow()}
          >
            <Text>+</Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    );
  }

  componentDidMount() {
    // this.focusLastRowPrice();
  }

  componentDidUpdate() {
    // this.focusLastRowPrice();
  }



}

class Shopperlator extends Component  <any, any> {

  priceRef: any
  discountRef: any
  weightRef: any

  constructor(props: any) {
    super(props);
    this.state = {
      price: "10",
      discount: "0",
      weight: "454",
      weightUnit: 'g',
      final: '10.00',
      finalUnit: 'lb'
    }
    
  }

  async onChange(state: any) {

    for (let key in state) {
      let value = state[key];
      value = value
        .replace(/[^0-9\.]/g, '') // only 0 - 9 and decminal
        .replace(/^\./, '0.') // added leading zero
        .replace(/^ 0+/, '0') // only 1 leading zero
        .replace(/^(\d+\.\d+)\./, '$1') // remove second dot
        .replace(/(\.\d\d)\d$/, '$1') // keep only 2 decimal place
      state[key] = value; 
    }

    await this.setState(state);
    this.updateFinal();

  }

  updateFinal() {

    let {price, discount, weight, weightUnit, final, finalUnit} = this.state;

    price = parseFloat(price);
    discount = parseFloat(discount);
    weight = parseFloat(weight);

    if (finalUnit == 'lb') {
      switch (weightUnit) {
        case 'kg': weight = weight * 1000 / 454;  break;
        case 'g':  weight = weight / 454;         break;
        case 'lb':                                break;
      }
    } else if (finalUnit == '100g') {
      switch (weightUnit) {
        case 'kg': weight = weight * 1000 / 100;  break;
        case 'g':  weight = weight / 100;         break;
        case 'lb': weight = weight * 454 / 100;   break;
      }
    } if (finalUnit == 'kg') {
      switch (weightUnit) {
        case 'kg': weight = weight;               break;
        case 'g':  weight = weight / 1000;        break;
        case 'lb': weight = weight * 454 / 1000;  break;
      }
    }

    final = ((price - discount) / weight).toFixed(2).toString();

    this.setState({
      final
    })

  }

  async rotateWeight() {

    let unit = this.state.weightUnit;
    let weight = Number(this.state.weight);
    let w = '';
    
    switch (unit) {
      case 'kg': unit = 'g'; weight = weight * 1000; break;
      case 'g':  unit = 'lb'; weight = weight / 454; break;
      case 'lb': unit = 'kg'; weight = weight * 454 / 1000; break;
    }

    switch (unit) {
      case 'kg': w = Number(weight.toFixed(3)).toString(); break;
      case 'g':  w = weight.toFixed(0); break;
      case 'lb': w = Number(weight.toFixed(2)).toString(); break;
    }

    await this.setState({
      weight: w,
      weightUnit: unit
    })

  }

  async rotateFinal() {

    let unit = this.state.finalUnit;
    
    switch (unit) {
      case 'kg': unit = '100g';  break;
      case '100g':  unit = 'lb'; break;
      case 'lb': unit = 'kg';    break;
    }
    
    await this.setState({
      finalUnit: unit
    })

    this.updateFinal()

  }

  render() {

    let {price, discount, weight, weightUnit, final, finalUnit} = this.state;
    let { handleSubmit, rowIndex } = this.props;

    return (
    <View style={styles.shopperlator}>
      <View style={styles.dataBox}>
        <View style={styles.data}>
          <View style={styles.textBox}>
            <Text>sale:</Text> 
          </View>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder={price}
              value={price}
              onChangeText={ text => this.onChange({price: text})}
              ref={input => this.priceRef = input}
              selectTextOnFocus={true}
              onSubmitEditing = {() => handleSubmit(rowIndex, 'price')}
              keyboardType='numeric'
            />
          </View>
        </View>
        <View style={styles.data}>
          <View style={styles.textBox}>
            <Text>promo:</Text>
          </View>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder='2'
              value={discount}
              onChangeText={ text => this.onChange({discount: text})}
              ref={input => this.discountRef = input}
              selectTextOnFocus={true}
              onSubmitEditing = {() => handleSubmit(rowIndex, 'discount')}
              keyboardType='numeric'
          
            />
          </View>
        </View>

        <View style={styles.data}>
          <View style={styles.textBox}>
            <Text onPress={() => this.rotateWeight()}>weight:</Text>
          </View>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder={weight}
              value={weight}
              onChangeText={ text => this.onChange({weight: text})}
              ref={input => this.weightRef = input}
              selectTextOnFocus={true}
              onSubmitEditing = {() => handleSubmit(rowIndex, 'weight')}
              keyboardType='numeric'
            />
            <Text>{weightUnit}</Text>
          </View>
        </View>
      </View>
      <View style={styles.finalBox}>
        <Text style={styles.final} onPress={() => this.rotateFinal()}>${final}/{finalUnit}</Text>
      </View>
    </View>
    )
  }

  componentDidMount() {
    setTimeout(() => this.priceRef.focus(), 1)
  }

}

let orientation = () => {
  let d = Dimensions.get('window');
  return d.height >= d.width ? 'portrait' : 'landscape'
}


const styles = StyleSheet.create({
  portrait: {
    width: '100%',
  },
  landscape: {
    width: '50%',
  },
  container: {
    // alignItems: 'stretch',
    justifyContent: 'space-between',
    margin: 'auto',
    height: '100%',
  },
    titleView: {
      // marginBottom: 12,
      backgroundColor: 'rgba(64,0,64,0.2)',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
    },
    mainView: {
      flexGrow: 1,
      // flexShrink: 1,
      paddingTop: 6,
      paddingBottom: 6,
      justifyContent: 'center',  
      // backgroundColor: 'blue',

      // width: '100%',
    },
    navView: {
      // width: '100%',
      flexDirection: 'row',
      // marginTop: 12,
      // alignItems: 'stretch',
      // backgroundColor: 'red',
      // justifyContent: 'space-around',
      // padding: 6,
    },
      icon: {
        width: 24,
        height: 24,
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
      },

      shopperlator: {
        marginTop: 6,
        marginBottom: 6,
        padding: 12,
        // minHeight: 100,
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 10,
        borderColor: 'rgba(0,255,0,0.4)',
        backgroundColor: 'rgba(0,255,0,0.2)',
        flexWrap: 'wrap',
        // alignItems: 'flex-start',
        alignContent: 'stretch',
        justifyContent: 'space-between',
      },
      better: {
        color: 'red',
      },
        dataBox: {
          // backgroundColor: 'red',
          // flex: 4,
          flexDirection: 'row',
          justifyContent: 'space-around',
          // borderWidth: 1,
          // backgroundColor: 'lightblue',
          flexGrow: 10,
        },
        finalBox: {
          flexGrow: 1,
          flexBasis: 150,
          flexShrink: 0,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          // backgroundColor: 'pink',
          // padding: 6,
        },
          data: {
            // backgroundColor: 'purple',
            flexDirection: 'row',
            // padding: 6,
            
            // alignItems: 'center',
            // borderWidth: 1,
            // backgroundColor: 'violet',
            flexGrow: 1,
            flexShrink: 1,
            justifyContent: 'center',
            alignItems: 'center',

          },
            textBox: {
              // backgroundColor: 'red',
              // flex: 1,
            },
            inputBox: {
              flexDirection: 'row',
              alignItems: 'center',
              // backgroundColor: 'orange',
              // flexBasis: 80,
              // flexShrink: 1,
              // flexGrow: 1,
              // flex: 2,
            },
            input: {
              width: 60,
              // backgroundColor: 'red',
              textAlign: 'right',
              // marginRight: 2,
              // marginLeft: 2,
              // textAlign: 'right',
            },

            final: {
              fontSize: 24,
              color: 'green',
            },




      button: {
        // backgroundColor: 'purple',
        // flex: 1,
        // flexBasis: 400,
        padding: 12,
        // margin: 6,
        flexGrow: 1,
        // borderRadius: 12,
        // borderWidth: 1,
        // borderStyle: 'dotted',
        borderColor: 'rgba(0,0,255,0.4)',
        backgroundColor: 'rgba(0,0,255,0.2)',
        alignItems: 'center',
      }
});

export default App;